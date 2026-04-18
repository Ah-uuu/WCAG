const express = require('express');
const { stripe, PLAN_PRICE_MAP } = require('../lib/stripe');
const { prisma } = require('../lib/db');

const router = express.Router();

// Helper: compatible with Stripe API 2026-03-25.dahlia which moved current_period_end
function getPeriodEnd(stripeSub) {
  const ts =
    stripeSub.current_period_end ??
    stripeSub.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('[WEBHOOK] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[WEBHOOK] Received: ${event.type}`);

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;
        const userId = session.metadata?.userId;
        if (!userId) break;

        const stripeSub      = await stripe.subscriptions.retrieve(session.subscription);
        const priceId        = stripeSub.items.data[0]?.price?.id;
        const plan           = PLAN_PRICE_MAP[priceId] || 'FREE';
        const currentPeriodEnd = getPeriodEnd(stripeSub);

        await prisma.Subscription.upsert({
          where:  { userId },
          update: {
            stripeCustomerId:     session.customer,
            stripeSubscriptionId: session.subscription,
            stripePriceId:        priceId,
            plan,
            status:               'ACTIVE',
            currentPeriodEnd,
            cancelAtPeriodEnd:    stripeSub.cancel_at_period_end ?? false,
          },
          create: {
            userId,
            stripeCustomerId:     session.customer,
            stripeSubscriptionId: session.subscription,
            stripePriceId:        priceId,
            plan,
            status:               'ACTIVE',
            currentPeriodEnd,
            cancelAtPeriodEnd:    stripeSub.cancel_at_period_end ?? false,
          },
        });

        console.log(`[WEBHOOK] Subscription activated: user=${userId} plan=${plan}`);
        break;
      }

      // KEY FIX: changed from updateMany -> upsert so record is created if missing
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object;
        const userId    = stripeSub.metadata?.userId;
        if (!userId) break;

        const priceId          = stripeSub.items.data[0]?.price?.id;
        const plan             = PLAN_PRICE_MAP[priceId] || 'FREE';
        const currentPeriodEnd = getPeriodEnd(stripeSub);
        const statusMap = { active: 'ACTIVE', canceled: 'CANCELED', past_due: 'PAST_DUE', incomplete: 'INCOMPLETE' };
        const status = statusMap[stripeSub.status] || 'ACTIVE';

        await prisma.Subscription.upsert({
          where:  { userId },
          update: {
            stripeCustomerId:     stripeSub.customer,
            stripeSubscriptionId: stripeSub.id,
            stripePriceId:        priceId,
            plan,
            status,
            currentPeriodEnd,
            cancelAtPeriodEnd:    stripeSub.cancel_at_period_end ?? false,
          },
          create: {
            userId,
            stripeCustomerId:     stripeSub.customer,
            stripeSubscriptionId: stripeSub.id,
            stripePriceId:        priceId,
            plan,
            status,
            currentPeriodEnd,
            cancelAtPeriodEnd:    stripeSub.cancel_at_period_end ?? false,
          },
        });

        console.log(`[WEBHOOK] Subscription updated: user=${userId} plan=${plan} status=${stripeSub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object;
        const userId    = stripeSub.metadata?.userId;
        if (!userId) break;

        await prisma.Subscription.updateMany({
          where: { userId },
          data: {
            plan:                 'FREE',
            status:               'CANCELED',
            stripeSubscriptionId: null,
            stripePriceId:        null,
            currentPeriodEnd:     null,
            cancelAtPeriodEnd:    false,
          },
        });

        console.log(`[WEBHOOK] Subscription canceled: user=${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice   = event.data.object;
        const stripeSub = invoice.subscription ? await stripe.subscriptions.retrieve(invoice.subscription) : null;
        const userId    = stripeSub?.metadata?.userId;
        if (!userId) break;
        await prisma.Subscription.updateMany({ where: { userId }, data: { status: 'PAST_DUE' } });
        console.log(`[WEBHOOK] Payment failed: user=${userId}`);
        break;
      }

      case 'invoice.paid': {
        const invoice   = event.data.object;
        const stripeSub = invoice.subscription ? await stripe.subscriptions.retrieve(invoice.subscription) : null;
        const userId    = stripeSub?.metadata?.userId;
        if (!userId) break;
        const currentPeriodEnd = getPeriodEnd(stripeSub);
        await prisma.Subscription.updateMany({ where: { userId }, data: { status: 'ACTIVE', currentPeriodEnd } });
        console.log(`[WEBHOOK] Invoice paid: user=${userId}`);
        break;
      }

      default:
        break;
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[WEBHOOK] Handler error:', err.message, err.stack);
    return res.status(500).json({ error: 'Webhook handler failed.' });
  }
});

module.exports = router;
