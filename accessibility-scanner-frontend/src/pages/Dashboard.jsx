import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { getScanHistory, getSubscription, createPortal } from '../lib/api';
import HpBar from '../components/HpBar';
import PixelLoader from '../components/PixelLoader';

const PLAN_COLORS = {
  FREE:       { color: 'text-pixel-white',  label: '🧑‍🌾 PEASANT' },
  PRO:        { color: 'text-pixel-green',  label: '⚔️ WARRIOR' },
  BUSINESS:   { color: 'text-pixel-cyan',   label: '🛡️ KNIGHT' },
  ENTERPRISE: { color: 'text-pixel-yellow', label: '👑 KING' },
};

const PLAN_LIMITS = { FREE: 10, PRO: 200, BUSINESS: 1000, ENTERPRISE: -1 };

export default function Dashboard() {h
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [scans, setScans]           = useState([]);
  const [sub, setSub]               = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session) navigate('/sign-in');
  }, [session, isPending, navigate]);

  useEffect(() => {
    if (!session) return;
    getScanHistory().then((data) => setScans(Array.isArray(data?.scans) ? data.scans : [])).catch(console.error);
    getSubscription().then(setSub).catch(console.error).finally(() => setLoadingSub(false));
  }, [session]);

  if (isPending || (!session && !isPending)) return <PixelLoader message="LOADING SAVE DATA..." />;

  const plan       = sub?.plan || 'FREE';
  const planInfo   = PLAN_COLORS[plan] || PLAN_COLORS.FREE;
  const scansUsed  = sub?.scansUsed ?? 0;
  const scansLimit = PLAN_LIMITS[plan] ?? 10;
  const scansLeft  = scansLimit === -1 ? '∞' : Math.max(0, scansLimit - scansUsed);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createPortal();
      window.location.href = url;
    } catch { alert('Could not open portal. Please try again.'); }
    finally { setPortalLoading(false); }
  };

  return (
    <div className="min-h-screen bg-pixel-bg py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="pixel-box p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-shrink-0 w-16 h-16 bg-pixel-dark border-2 border-pixel-green flex items-center justify-center text-3xl">
            {plan === 'ENTERPRISE' ? '👑' : plan === 'BUSINESS' ? '🛡️' : plan === 'PRO' ? '⚔️' : '🧑‍🌾'}
          </div>
          <div className="flex-1">
            <div className="font-pixel text-pixel-green text-xs mb-1">
              {session.user.name || session.user.email.split('@')[0]}
            </div>
            <div className={`font-pixel text-xs ${planInfo.color} mb-3`}>{planInfo.label}</div>
            <div className="max-w-xs">
              <div className="flex justify-between text-xs text-pixel-gray mb-1">
                <span>SCAN MP</span>
                <span className={planInfo.color}>{scansUsed} / {scansLimit === -1 ? '∞' : scansLimit}</span>
              </div>
              {scansLimit !== -1 && <HpBar value={scansUsed} max={scansLimit} />}
              {scansLimit === -1 && <div className="text-pixel-yellow text-xs">∞ UNLIMITED POWER</div>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/scan" className="btn-green text-xs py-2 px-4 text-center">▶ NEW SCAN</Link>
            {plan !== 'FREE' && (
              <button onClick={handlePortal} disabled={portalLoading} className="btn-ghost text-xs py-2 px-4">
                {portalLoading ? '...' : '⚙ MANAGE PLAN'}
              </button>
            )}
            {plan === 'FREE' && <Link to="/pricing" className="btn-yellow text-xs py-2 px-4 text-center">★ UPGRADE</Link>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'TOTAL SCANS', value: scans.length,    color: 'text-pixel-green' },
            { label: 'SCANS LEFT',  value: scansLeft,       color: 'text-pixel-cyan' },
            { label: 'AVG SCORE',   value: avgScore(scans), color: 'text-pixel-yellow' },
            { label: 'BUGS FOUND',  value: totalBugs(scans),color: 'text-pixel-red' },
          ].map((s) => (
            <div key={s.label} className="pixel-box-dark p-4 text-center">
              <div className={`font-pixel text-lg ${s.color} mb-1`}>{s.value}</div>
              <div className="text-pixel-gray text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="pixel-box px-4 py-2 inline-flex items-center gap-2">
              <span className="text-pixel-green text-xs">📜 QUEST LOG</span>
            </div>
            <Link to="/scan" className="text-pixel-green text-xs hover:text-glow-green">+ NEW QUEST</Link>
          </div>
          {loadingSub ? <PixelLoader message="LOADING HISTORY..." /> :
           scans.length === 0 ? (
            <div className="pixel-box-dark p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <div className="font-pixel text-pixel-gray text-xs mb-4">NO QUESTS COMPLETED YET</div>
              <Link to="/scan" className="btn-green text-xs py-3 px-6">▶ START FIRST SCAN</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.slice(0, 10).map((scan) => <ScanRow key={scan.id} scan={scan} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScanRow({ scan }) {
  const score = scan.score ?? 0;
  const scoreColor = score >= 80 ? 'text-pixel-green' : score >= 50 ? 'text-pixel-yellow' : 'text-pixel-red';
  return (
    <div className="pixel-box-dark p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-pixel-white text-xs truncate mb-1">{scan.url}</div>
        <div className="text-pixel-gray text-xs">{formatDate(scan.createdAt)}</div>
      </div>
      <div className="w-32 flex-shrink-0"><HpBar value={score} max={100} /></div>
      <div className={`font-pixel text-sm ${scoreColor} flex-shrink-0`}>{score}</div>
      <div className="flex gap-2 flex-shrink-0">
        <span className="text-pixel-red text-xs">{scan.violations ?? 0} bugs</span>
        {scan.id && (
          <a href={`/api/report/pdf/${scan.id}`} target="_blank" rel="noreferrer"
            className="text-pixel-cyan text-xs hover:underline">📜 PDF</a>
        )}
      </div>
    </div>
  );
}

function avgScore(scans) {
  if (!scans.length) return '—';
  return Math.round(scans.reduce((s, c) => s + (c.score ?? 0), 0) / scans.length);
}
function totalBugs(scans) { return scans.reduce((s, c) => s + (c.violations ?? 0), 0); }
function formatDate(dateStr) {
  try { return new Date(dateStr).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }); }
  catch { return dateStr; }
}
