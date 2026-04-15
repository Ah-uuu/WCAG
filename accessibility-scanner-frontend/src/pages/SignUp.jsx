import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, signIn } from '../lib/auth';

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('PASSWORDS DO NOT MATCH.'); return; }
    if (form.password.length < 8) { setError('PASSWORD MUST BE AT LEAST 8 CHARACTERS.'); return; }
    setLoading(true);
    try {
      await signUp.email({ email: form.email, password: form.password, name: form.name || form.email.split('@')[0] });
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'REGISTRATION FAILED. EMAIL MAY ALREADY EXIST.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signIn.social({ provider: 'google', callbackURL: `${window.location.origin}/dashboard` });
    } catch { setError('GOOGLE SIGN-UP FAILED.'); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-pixel-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-5"
        style={{ backgroundImage: 'linear-gradient(#b14aff 1px, transparent 1px), linear-gradient(90deg, #b14aff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block pixel-box-purple px-8 py-3 mb-4">
            <span className="font-pixel text-pixel-purple text-xs">🆕 NEW GAME</span>
          </div>
          <p className="text-pixel-gray text-xs">Create your hero and start the quest</p>
        </div>
        <div className="pixel-box-purple p-8">
          <button onClick={handleGoogle} disabled={loading}
            className="btn-pixel bg-transparent border-2 border-pixel-purple text-pixel-purple w-full text-xs py-3 mb-6 flex items-center justify-center gap-3 hover:bg-pixel-purple hover:text-pixel-bg">
            <span>🌐</span><span>SIGN UP WITH GOOGLE</span>
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-pixel-border" />
            <span className="text-pixel-gray text-xs">OR</span>
            <div className="flex-1 border-t border-pixel-border" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-pixel text-pixel-gray text-xs mb-2">HERO NAME</label>
              <input type="text" className="pixel-input" placeholder="YourHeroName"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block font-pixel text-pixel-gray text-xs mb-2">EMAIL</label>
              <input type="email" className="pixel-input" placeholder="hero@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block font-pixel text-pixel-gray text-xs mb-2">PASSWORD</label>
              <input type="password" className="pixel-input" placeholder="Min. 8 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="block font-pixel text-pixel-gray text-xs mb-2">CONFIRM PASSWORD</label>
              <input type="password" className="pixel-input" placeholder="Repeat password"
                value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            {error && <div className="border-2 border-pixel-red bg-pixel-dark p-3"><span className="text-pixel-red text-xs">✗ {error}</span></div>}
            <button type="submit" disabled={loading} className="btn-purple w-full text-xs py-3 mt-2">
              {loading ? 'CREATING HERO...' : '★ CREATE ACCOUNT'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-pixel-gray text-xs">
              HAVE AN ACCOUNT?{' '}
              <Link to="/sign-in" className="text-pixel-purple underline">LOAD GAME</Link>
            </p>
          </div>
        </div>
        <div className="text-center mt-6">
          <span className="text-pixel-gray text-xs">By registering, you accept our terms of service</span>
        </div>
      </div>
    </div>
  );
}
