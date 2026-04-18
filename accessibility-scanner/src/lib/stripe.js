const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// ── 方案設定（Price ID → 方案名稱）
// 使用 if 逐一建立，避免 env var 未設定時 key 變成字串 'undefined'
const PLAN_PRICE_MAP = {};
if (process.env.STRIPE_PRICE_PRO)        PLAN_PRICE_MAP[process.env.STRIPE_PRICE_PRO]        = 'PRO';
if (process.env.STRIPE_PRICE_BUSINESS)   PLAN_PRICE_MAP[process.env.STRIPE_PRICE_BUSINESS]   = 'BUSINESS';
if (process.env.STRIPE_PRICE_ENTERPRISE) PLAN_PRICE_MAP[process.env.STRIPE_PRICE_ENTERPRISE] = 'ENTERPRISE';

const PLAN_LIMITS = {
  FREE:       10,
  PRO:       200,
  BUSINESS:  1000,
  ENTERPRISE: -1,
};

const PLAN_LABELS = {
  FREE:       'Free',
  PRO:        'Pro — $29/mo',
  BUSINESS:   'Business — $99/mo',
  ENTERPRISE: 'Enterprise — $299/mo',
};

module.exports = { stripe, PLAN_PRICE_MAP, PLAN_LIMITS, PLAN_LABELS };
