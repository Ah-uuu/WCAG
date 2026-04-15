import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signIn } from '../lib/auth';

export default function SignIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/dashboard';
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn.email({ email: form.email, password: form.password });
      navigate(redirect);
    } catch (err) {
      setError(err?.message || 'LOGIN FAILED. CHECK YOUR CREDENTIALS.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signIn.social({ provider: 'google', callbackURL: `${window.location.origin}${redirect}` });
    } catch {
      setError('GOOGLE LOGIN FAILED.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pixel-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-5"
        style={{ backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block pixel-box px-8 py-3 mb-4">
            <span className="font-pixel text-pixel-green text-xs">💾 LOAD GAME</span>
          </div>
          <p className="text-pixel-gray text-xs">Continue your accessibility quest</p>
        </div>
        <div className="pixel-box p-8">
          <button onClick={handleGoogle} disabled={loading}
            className="btn-ghost w-full text-xs py-3 mb-6 flex items-center justify-center gap-3">
            <span>🌐</span><span>CONTINUE WITH GOOGLE</span>
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 pixel-divider my-0" />
            <span className="text-pixel-gray text-xs">OR</span>
            <div className="flex-1 pixel-divider my-0" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-pixel text-pixel-gray text-xs mb-2">EMAIL</label>
              <input type="email" className="pixel-input" placeholder="hero@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block font-pixel text-pixel-gray text-xs mb-2">PASSWORD</label>
              <input type="password" className="pixel-input" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            {error && (
              <div className="pixel-box border-pixel-red p-3">
                <span className="text-pixel-red text-xs">✗ {error}</span>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-green w-full text-xs py-3 mt-2">
              {loading ? 'AUTHENTICATING...' : '▶ LOGIN'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-pixel-gray text-xs">
              NEW PLAYER?{' '}
              <Link to="/sign-up" className="text-pixel-green hover:text-glow-green underline">CREATE ACCOUNT</Link>
            </p>
          </div>
        </div>
        <div className="text-center mt-6">
          <span className="text-pixel-gray text-xs animate-pulse">INSERT COIN TO CONTINUE</span>
        </div>
      </div>
    </div>
  );
}
