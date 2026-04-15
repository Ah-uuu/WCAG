import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSession, signOut } from '../lib/auth';
import { ShieldSprite } from './PixelSprite';

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="relative z-50 border-b-2 border-pixel-green bg-pixel-dark">
      <div className="h-1 w-full"
        style={{ background: 'repeating-linear-gradient(90deg, #00ff41 0px, #00ff41 8px, transparent 8px, transparent 16px)' }}
      />
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="animate-float">
            <ShieldSprite size={28} color="#00ff41" />
          </div>
          <div>
            <span className="text-pixel-green text-glow-green font-pixel text-xs tracking-widest">ACCESS</span>
            <span className="text-pixel-yellow text-glow-yellow font-pixel text-xs tracking-widest">SCAN</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" active={isActive('/')}>HOME</NavLink>
          <NavLink to="/scan" active={isActive('/scan')}>▶ SCAN</NavLink>
          <NavLink to="/pricing" active={isActive('/pricing')}>PRICING</NavLink>
          {session && <NavLink to="/dashboard" active={isActive('/dashboard')}>DASHBOARD</NavLink>}
        </div>

        <div className="flex items-center gap-2">
          {isPending ? (
            <span className="text-pixel-gray text-xs animate-pulse">LOADING...</span>
          ) : session ? (
            <div className="flex items-center gap-3">
              <span className="text-pixel-green text-xs hidden sm:block">
                ▸ {session.user.name || session.user.email.split('@')[0]}
              </span>
              <button onClick={handleSignOut} className="btn-ghost text-xs py-2 px-3">LOGOUT</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/sign-in" className="btn-ghost text-xs py-2 px-3">LOGIN</Link>
              <Link to="/sign-up" className="btn-green text-xs py-2 px-3">START</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to}
      className={`font-pixel text-xs px-3 py-2 transition-all duration-100 ${
        active ? 'text-pixel-green text-glow-green border-b-2 border-pixel-green' : 'text-pixel-gray hover:text-pixel-white'
      }`}
    >
      {children}
    </Link>
  );
}
