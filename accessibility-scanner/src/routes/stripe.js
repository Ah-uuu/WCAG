const express = require('express');
const { stripe, PLAN_PRICE_MAP, PLAN_LABELS } = require('../lib/stripe');
const { prisma } = require('../lib/db');
const { requireAuth } = require('../middleware/requireAuth');
const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stripe/checkout
// 建立 Stripe Checkout Session（新訂閱）或導向 Customer Portal（已訂閱升降級）
// Body: { priceId: "price_xxx" }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/checkout', requireAuth, async (req, res) => {
  const { priceId } = req.body;
  if (!priceId) {
    return res.status(400).json({ error: 'priceId is required' });
  }

  if (!Object.keys(PLAN_PRICE_MAP).includes(priceId)) {
    return res.status(400).json({ error: 'Invalid priceId' });
  }

  try {
    const userId = req.user.id;
    const email  = req.user.email;

    const sub = await prisma.Subscription.findUnique({ where: { userId } });

    // 已有有效訂閱：導向 Customer Portal
    if (sub?.stripeCustomerId && sub?.stripeSubscriptionId && sub.status === 'ACTIVE') {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer:   sub.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL}/dashboard`,
      });
      return res.json({ url: portalSession.url });
    }

    const customerOptions = sub?.stripeCustomerId
      ? { customer: sub.stripeCustomerId }
      : { customer_email: email };

    const session = await stripe.checkout.sessions.create({
      ...customerOptions,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url:  `${process.env.FRONTEND_URL}/pricing?checkout=cancel`,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
      allow_promotion_codes: true,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('[STRIPE CHECKOUT]', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stripe/portal
// ─────────────────────────────────────────────────────────────────────────────
router.post('/portal', requireAuth, async (req, res) => {
  try {
    const sub = await prisma.Subscription.findUnique({ where: { userId: req.user.id } });
    if (!sub?.stripeCustomerId) {
      return res.status(404).json({ error: 'No active subscription found.' });
    }
    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   sub.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });
    return res.json({ url: portalSession.url });
  } catch (err) {
    console.error('[STRIPE PORTAL]', err.message);
    return res.status(500).json({ error: 'Failed to create portal session.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/stripe/subscription
// 回傳目前用戶的方案資訊與本月用量
// ─────────────────────────────────────────────────────────────────────────────
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const sub    = await prisma.Subscription.findUnique({ where: { userId } });
    const plan   = sub?.status === 'ACTIVE' ? (sub.plan || 'FREE') : 'FREE';

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const scansUsed  = await prisma.Scan.count({
      where: { userId, createdAt: { gte: monthStart } },
    });

    return res.json({
      plan,
      status:           sub?.status ?? 'FREE',
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      scansUsed,
      label: PLAN_LABELS[plan] || plan,
    });
  } catch (err) {
    console.error('[STRIPE SUBSCRIPTION]', err.message);
    return res.status(500).json({ error: 'Failed to fetch subscription info.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stripe/sync
// 付款跳轉回來後，主動從 Stripe 拉最新訂閱狀態更新 DB
// 解決 webhook 尚未抵達時 Dashboard 仍顯示 FREE 的競速問題
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const sub    = await prisma.Subscription.findUnique({ where: { userId } });

    if (!sub?.stripeCustomerId) {
      return res.json({ plan: 'FREE', synced: false });
    }

    // 直接向 Stripe 查詢此 customer 的活躍訂閱
    const { data: activeSubs } = await stripe.subscriptions.list({
      customer: sub.stripeCustomerId,
      status:   'active',
      limit:    1,
    });

    if (activeSubs.length === 0) {
      return res.json({ plan: 'FREE', synced: false });
    }

    const stripeSub = activeSubs[0];
    const priceId   = stripeSub.items.data[0]?.price?.id;
    const plan      = PLAN_PRICE_MAP[priceId] || 'FREE';

    await prisma.Subscription.update({
      where: { userId },
      data: {
        stripeSubscriptionId: stripeSub.id,
        stripePriceId:        priceId,
        plan,
        status:           'ACTIVE',
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      },
    });

    console.log(`[STRIPE SYNC] user ${userId} synced to plan: ${plan}`);
    return res.json({ plan, synced: true });
  } catch (err) {
    console.error('[STRIPE SYNC]', err.message);
    return res.status(500).json({ error: 'Failed to sync subscription.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stripe/cancel
// 在當前計費周期結束時取消訂閱
// ─────────────────────────────────────────────────────────────────────────────
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const sub    = await prisma.Subscription.findUnique({ where: { userId } });

    if (!sub?.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found.' });
    }
    if (sub.cancelAtPeriodEnd) {
      return res.status(400).json({ error: 'Subscription is already set to cancel.' });
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.Subscription.update({
      where: { userId },
      data:  { cancelAtPeriodEnd: true },
    });

    return res.json({ success: true, cancelAtPeriodEnd: true });
  } catch (err) {
    console.error('[STRIPE CANCEL]', err.message);
    return res.status(500).json({ error: 'Failed to cancel subscription.' });
  }
});

module.exports = router;
