import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { createCheckout } from '../lib/api';
import { ShieldSprite, SwordSprite, CrownSprite } from '../components/PixelSprite';

const PLANS = [
  {
    id: 'free', name: 'PEASANT', price: 0, unit: 'FOREVER',
    color: 'pixel-box-dark', textColor: 'text-pixel-white', badge: '🧑‍🌾',
    features: ['10 scans / month', 'Basic WCAG report', 'HTML export', 'Community support'],
    priceId: null, cta: 'PLAY FREE', ctaClass: 'btn-ghost',
  },
  {
    id: 'pro', name: 'WARRIOR', price: 29, unit: '/MONTH',
    color: 'pixel-box', textColor: 'text-pixel-green', badge: '⚔️',
    features: ['200 scans / month', 'Full WCAG 2.1 AA report', 'PDF + HTML export', 'Scan history (30 days)', 'Email support'],
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO, cta: '▶ SELECT CLASS', ctaClass: 'btn-green', popular: true,
  },
  {
    id: 'business', name: 'KNIGHT', price: 99, unit: '/MONTH',
    color: 'pixel-box-cyan', textColor: 'text-pixel-cyan', badge: '🛡️',
    features: ['1,000 scans / month', 'Full WCAG 2.1 AA/AAA report', 'PDF + HTML + JSON export', 'Scan history (90 days)', 'Priority support', 'API access'],
    priceId: import.meta.env.VITE_STRIPE_PRICE_BUSINESS, cta: '▶ SELECT CLASS', ctaClass: 'btn-cyan',
  },
  {
    id: 'enterprise', name: 'KING', price: 299, unit: '/MONTH',
    color: 'pixel-box-yellow', textColor: 'text-pixel-yellow', badge: '👑',
    features: ['Unlimited scans', 'Custom WCAG rules', 'All export formats', 'Unlimited history', 'Dedicated support', 'API + Webhook', 'White-label reports'],
    priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE, cta: '▶ SELECT CLASS', ctaClass: 'btn-yellow',
  },
];

export default function Pricing() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleSelect = async (plan) => {
    if (!plan.priceId) { navigate('/sign-up'); return; }
    if (!session) { navigate('/sign-in?redirect=/pricing'); return; }
    setLoading(plan.id);
    try {
      const { url } = await createCheckout(plan.priceId);
      window.location.href = url;
    } catch { alert('ERROR: Could not start checkout. Please try again.'); }
    finally { setLoading(null); }
  };

  return (
    <div className="min-h-screen bg-pixel-bg py-16 px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-5"
        style={{ backgroundImage: 'linear-gradient(#ffd700 1px, transparent 1px), linear-gradient(90deg, #ffd700 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block pixel-box-yellow px-6 py-2 mb-6">
            <span className="text-pixel-yellow text-xs">⚔ CHARACTER SELECT ⚔</span>
          </div>
          <h1 className="font-pixel text-pixel-white text-lg mb-4">CHOOSE YOUR CLASS</h1>
          <p className="text-pixel-gray text-xs">Select your hero class to begin the accessibility quest</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`${plan.color} p-6 relative flex flex-col transition-transform hover:-translate-y-2`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pixel-green text-pixel-bg font-pixel text-xs px-3 py-1 whitespace-nowrap">
                  ★ POPULAR ★
                </div>
              )}
              <div className="text-center mb-4 mt-2">
                <div className="text-3xl mb-2 animate-float">{plan.badge}</div>
                <div className={`font-pixel text-xs ${plan.textColor} mb-1`}>{plan.name}</div>
                <div className="text-pixel-gray text-xs">CLASS</div>
              </div>
              <div className="text-center mb-6 pixel-box-dark p-3">
                <div className={`font-pixel text-2xl ${plan.textColor}`}>{plan.price === 0 ? 'FREE' : `$${plan.price}`}</div>
                <div className="text-pixel-gray text-xs mt-1">{plan.unit}</div>
              </div>
              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-pixel-gray">
                    <span className={`${plan.textColor} mt-0.5`}>▸</span><span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className={`${plan.ctaClass} w-full text-center text-xs py-3`}
                onClick={() => handleSelect(plan)} disabled={loading === plan.id}>
                {loading === plan.id ? 'LOADING...' : plan.cta}
              </button>
            </div>
          ))}
        </div>
        <div className="pixel-box p-8 max-w-2xl mx-auto">
          <h2 className="font-pixel text-pixel-green text-xs mb-6 text-center">GAME FAQ</h2>
          {[
            ['Can I change plans later?', 'Yes! Upgrade or downgrade anytime through the player portal.'],
            ['Is there a free trial?', 'The Peasant (Free) plan is always free with 10 scans/month. No card needed.'],
            ['What payment methods?', 'Credit cards and debit cards via Stripe. Secure and encrypted.'],
            ['Can I cancel anytime?', 'Yes, cancel anytime. No hidden fees or commitments.'],
          ].map(([q, a]) => (
            <div key={q} className="mb-4 last:mb-0">
              <div className="text-pixel-yellow text-xs mb-1">▸ {q}</div>
              <div className="text-pixel-gray text-xs pl-3 leading-relaxed">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
