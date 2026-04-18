const express = require('express');
const { stripe, PLAN_PRICE_MAP, PLAN_LIMITS, PLAN_LABELS } = require('../lib/stripe');
const { prisma } = require('../lib/db');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

// Helper: get current_period_end compatible with Stripe API 2026+
function getPeriodEnd(stripeSub) {
  const ts = stripeSub.current_period_end ?? stripeSub.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

// POST /api/stripe/checkout
router.post('/checkout', requireAuth, async (req, res) => {
  const { priceId } = req.body;
  const validPrices = [
    process.env.STRIPE_PRICE_PRO,
    process.env.STRIPE_PRICE_BUSINESS,
    process.env.STRIPE_PRICE_ENTERPRISE,
  ].filter(Boolean);

  if (!priceId || !validPrices.includes(priceId)) {
    return res.status(400).json({ error: 'Invalid price ID.' });
  }

  try {
    let subscription = await prisma.Subscription.findUnique({ where: { userId: req.user.id } });
    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name:  req.user.name || undefined,
        metadata: { userId: req.user.id },
      });
      customerId = customer.id;
      subscription = await prisma.Subscription.upsert({
        where:  { userId: req.user.id },
        update: { stripeCustomerId: customerId },
        create: { userId: req.user.id, stripeCustomerId: customerId, plan: 'FREE', status: 'ACTIVE' },
      });
    }

    if (subscription?.stripeSubscriptionId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId, return_url: process.env.FRONTEND_URL + '/dashboard',
      });
      return res.json({ url: portalSession.url });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.FRONTEND_URL + '/dashboard?checkout=success',
      cancel_url:  process.env.FRONTEND_URL + '/pricing?canceled=true',
      metadata: { userId: req.user.id },
      subscription_data: { metadata: { userId: req.user.id } },
    });
    return res.json({ url: session.url });
  } catch (err) {
    console.error('[STRIPE] Checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

// POST /api/stripe/portal
router.post('/portal', requireAuth, async (req, res) => {
  try {
    const subscription = await prisma.Subscription.findUnique({ where: { userId: req.user.id } });
    if (!subscription?.stripeCustomerId) {
      return res.status(404).json({ error: 'No subscription found.' });
    }
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: process.env.FRONTEND_URL + '/dashboard',
    });
    return res.json({ url: portalSession.url });
  } catch (err) {
    console.error('[STRIPE] Portal error:', err.message);
    return res.status(500).json({ error: 'Failed to open customer portal.' });
  }
});

// GET /api/stripe/subscription
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const subscription = await prisma.Subscription.findUnique({ where: { userId: req.user.id } });
    const plan  = subscription?.plan  ?? 'FREE';
    const limit = PLAN_LIMITS[plan];
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const used = await prisma.Scan.count({
      where: { userId: req.user.id, createdAt: { gte: startOfMonth } },
    });
    return res.json({
      plan,
      label:             PLAN_LABELS[plan],
      status:            subscription?.status ?? 'ACTIVE',
      currentPeriodEnd:  subscription?.currentPeriodEnd,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      usage: { used, limit, unlimited: limit === -1 },
    });
  } catch (err) {
    console.error('[STRIPE] Get subscription error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch subscription.' });
  }
});

// POST /api/stripe/sync
// Bypasses webhook race condition by querying Stripe directly.
// IMPROVED: if no stripeCustomerId in DB, looks up customer by email on Stripe.
router.post('/sync', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    let sub = await prisma.Subscription.findUnique({ where: { userId } });
    let stripeCustomerId = sub?.stripeCustomerId;

    // Bootstrap: if no customerId in DB, look up by email on Stripe
    if (!stripeCustomerId && req.user.email) {
      const { data: customers } = await stripe.customers.list({ email: req.user.email, limit: 5 });
      const match = customers.find(c => c.metadata?.userId === userId) || customers[0];
      stripeCustomerId = match?.id || null;
      console.log('[SYNC] Bootstrap customer lookup:', stripeCustomerId ? 'found ' + stripeCustomerId : 'not found');
    }

    if (!stripeCustomerId) {
      return res.json({ plan: 'FREE', synced: false });
    }

    const { data: activeSubs } = await stripe.subscriptions.list({
      customer: stripeCustomerId, status: 'active', limit: 1,
    });

    if (activeSubs.length === 0) {
      return res.json({ plan: 'FREE', synced: false });
    }

    const stripeSub   = activeSubs[0];
    const priceId     = stripeSub.items.data[0]?.price?.id;
    const plan        = PLAN_PRICE_MAP[priceId] || 'FREE';
    const currentPeriodEnd = getPeriodEnd(stripeSub);

    await prisma.Subscription.upsert({
      where:  { userId },
      update: {
        stripeCustomerId,
        stripeSubscriptionId: stripeSub.id,
        stripePriceId: priceId,
        plan,
        status: 'ACTIVE',
        currentPeriodEnd,
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
      },
      create: {
        userId,
        stripeCustomerId,
        stripeSubscriptionId: stripeSub.id,
        stripePriceId: priceId,
        plan,
        status: 'ACTIVE',
        currentPeriodEnd,
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
      },
    });

    console.log('[SYNC] Synced user=' + userId + ' plan=' + plan);
    return res.json({ plan, synced: true });
  } catch (err) {
    console.error('[SYNC] Error:', err.message);
    return res.status(500).json({ error: 'Sync failed.' });
  }
});

module.exports = router;
