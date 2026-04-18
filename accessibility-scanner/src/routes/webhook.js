const express = require('express');
const { stripe, PLAN_PRICE_MAP } = require('../lib/stripe');
const { prisma } = require('../lib/db');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Stripe API v2026+ 將 current_period_end 從訂閱根層級移至 items.data[0]
// 此 helper 兼容新舊版本
// ─────────────────────────────────────────────────────────────────────────────
function getPeriodEnd(stripeSub) {
  const ts = stripeSub.current_period_end
    ?? stripeSub.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /webhook/stripe
// 必須掛在 express.json() 之前，使用 express.raw() 解析原始 body
// ─────────────────────────────────────────────────────────────────────────────
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

      // ── 付款成功，Checkout 完成 ──────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const userId = session.metadata?.userId;
        if (!userId) {
          console.warn('[WEBHOOK] checkout.session.completed: missing userId in metadata');
          break;
        }

        const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
        const priceId   = stripeSub.items.data[0]?.price?.id;
        const plan      = PLAN_PRICE_MAP[priceId] || 'FREE';

        await prisma.Subscription.upsert({
          where:  { userId },
          update: {
            stripeSubscriptionId: session.subscription,
            stripePriceId:        priceId,
            plan,
            status:            'ACTIVE',
            currentPeriodEnd:  getPeriodEnd(stripeSub),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          },
          create: {
            userId,
            stripeCustomerId:     session.customer,
            stripeSubscriptionId: session.subscription,
            stripePriceId:        priceId,
            plan,
            status:           'ACTIVE',
            currentPeriodEnd: getPeriodEnd(stripeSub),
          },
        });

        console.log(`[WEBHOOK] Subscription activated: user=${userId} plan=${plan}`);
        break;
      }

      // ── 訂閱更新（升級 / 降級 / 取消預定）──────────────────────────────
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object;
        const userId    = stripeSub.metadata?.userId;
        if (!userId) {
          console.warn('[WEBHOOK] subscription.updated: missing userId in metadata');
          break;
        }

        const priceId = stripeSub.items.data[0]?.price?.id;
        const plan    = PLAN_PRICE_MAP[priceId] || 'FREE';

        const statusMap = {
          active:     'ACTIVE',
          canceled:   'CANCELED',
          past_due:   'PAST_DUE',
          incomplete: 'INCOMPLETE',
        };

        await prisma.Subscription.updateMany({
          where: { userId },
          data: {
            plan,
            stripePriceId:     priceId,
            status:            statusMap[stripeSub.status] || 'ACTIVE',
            currentPeriodEnd:  getPeriodEnd(stripeSub),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          },
        });

        console.log(`[WEBHOOK] Subscription updated: user=${userId} plan=${plan} status=${stripeSub.status}`);
        break;
      }

      // ── 訂閱取消 ────────────────────────────────────────────────────────
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

      // ── 發票付款失敗 ─────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice   = event.data.object;
        const stripeSub = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription)
          : null;
        const userId = stripeSub?.metadata?.userId;
        if (!userId) break;

        await prisma.Subscription.updateMany({
          where: { userId },
          data:  { status: 'PAST_DUE' },
        });

        console.log(`[WEBHOOK] Payment failed: user=${userId}`);
        break;
      }

      // ── 發票付款成功（訂閱續費）─────────────────────────────────────────
      case 'invoice.paid': {
        const invoice   = event.data.object;
        const stripeSub = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription)
          : null;
        const userId = stripeSub?.metadata?.userId;
        if (!userId) break;

        await prisma.Subscription.updateMany({
          where: { userId },
          data: {
            status:           'ACTIVE',
            currentPeriodEnd: getPeriodEnd(stripeSub),
          },
        });

        console.log(`[WEBHOOK] Invoice paid, subscription renewed: user=${userId}`);
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
