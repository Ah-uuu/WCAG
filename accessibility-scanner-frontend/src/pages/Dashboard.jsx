import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { getScanHistory, getSubscription, createPortal, cancelSubscription, getReportUrl } from '../lib/api';
import MpBar from '../components/MpBar';
import PixelLoader from '../components/PixelLoader';

const PLAN_COLORS = {
  FREE:       { color: 'text-pixel-white',  label: '🦹 PEASANT' },
  PRO:        { color: 'text-pixel-green',  label: '⚔️ WARRIOR' },
  BUSINESS:   { color: 'text-pixel-cyan',   label: '📡 KNIGHT' },
  ENTERPRISE: { color: 'text-pixel-yellow', label: '👑 KING' },
};
const PLAN_LIMITS = { FREE: 10, PRO: 200, BUSINESS: 1000, ENTERPRISE: -1 };

function formatDate(ts) {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [sub, setSub] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!isPending && !session) navigate('/sign-in');
  }, [session, isPending, navigate]);

  useEffect(() => {
    if (!session) return;
    getScanHistory()
      .then((data) => setScans(Array.isArray(data?.scans) ? data.scans : []))
      .catch(console.error);
    getSubscription()
      .then(setSub)
      .catch(console.error)
      .finally(() => setLoadingSub(false));
  }, [session]);

  if (isPending || (!session && !isPending)) return <PixelLoader message="LOADING SAVE DATA..." />;

  const plan = sub?.plan || 'FREE';
  const planInfo = PLAN_COLORS[plan] || PLAN_COLORS.FREE;
  const scansUsed = sub?.scansUsed ?? 0;
  const scansLimit = PLAN_LIMITS[plan] ?? 10;
  const scansLeft = scansLimit === -1 ? '∞' : Math.max(0, scansLimit - scansUsed);

  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  const cancelAtEnd = sub?.cancelAtPeriodEnd ?? false;
  const isPaidPlan = plan !== 'FREE' && sub?.status === 'ACTIVE';

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createPortal();
      window.location.href = url;
    } catch {
      alert('Could not open portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelSubscription();
      const fresh = await getSubscription();
      setSub(fresh);
      setShowCancelConfirm(false);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to cancel. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  function avgScore(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a, s) => a + (s.score ?? 0), 0) / arr.length);
  }
  function totalBugs(arr) {
    return arr.reduce((a, s) => a + (s.violations ?? 0), 0);
  }

  return (
    <div className="min-h-screen bg-pixel-bg py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── HERO CARD ── */}
        <div className="pixel-box p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-shrink-0 w-16 h-16 bg-pixel-dark border-2 border-pixel-green flex items-center justify-center text-3xl">
            {plan === 'ENTERPRISE' ? '👑' : plan === 'BUSINESS' ? '📡' : plan === 'PRO' ? '⚔️' : '🦹'}
          </div>
          <div className="flex-1">
            <div className="font-pixel text-pixel-green text-xs mb-1">
              {session?.user?.name || session?.user?.email?.split('@')[0]}
            </div>
            <div className={`font-pixel text-xs ${planInfo.color} mb-3`}>{planInfo.label}</div>
            <div className="max-w-xs">
              <div className="flex justify-between text-xs text-pixel-gray mb-1">
                <span>SCAN MP</span>
                <span className={planInfo.color}>{scansUsed} / {scansLimit === -1 ? '∞' : scansLimit}</span>
              </div>
              {scansLimit !== -1 && <MpBar value={scansUsed} max={scansLimit} />}
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

        {/* ── SUBSCRIPTION INFO ── */}
        {isPaidPlan && (
          <div className="pixel-box p-4 space-y-3">
            <div className="font-pixel text-pixel-green text-xs mb-2">📅 SUBSCRIPTION STATUS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="pixel-box-dark p-3">
                <div className="text-pixel-gray mb-1">
                  {cancelAtEnd ? '⏳ PLAN EXPIRES ON' : '💳 NEXT PAYMENT'}
                </div>
                <div className={`font-pixel ${cancelAtEnd ? 'text-pixel-red' : 'text-pixel-green'}`}>
                  {formatDate(periodEnd)}
                </div>
                {cancelAtEnd && (
                  <div className="text-pixel-red text-xs mt-1">
                    ⚠ Cancellation scheduled — plan active until then
                  </div>
                )}
              </div>
              <div className="pixel-box-dark p-3">
                <div className="text-pixel-gray mb-1">🎯 CURRENT PLAN</div>
                <div className={`font-pixel ${planInfo.color}`}>{planInfo.label}</div>
                <div className="text-pixel-gray text-xs mt-1">
                  Status: <span className={sub?.status === 'ACTIVE' ? 'text-pixel-green' : 'text-pixel-red'}>{sub?.status ?? 'FREE'}</span>
                </div>
              </div>
            </div>
            {!cancelAtEnd && (
              <div className="pt-1">
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-xs text-pixel-red border border-pixel-red px-3 py-1 hover:bg-pixel-red hover:text-pixel-dark transition-colors"
                  >
                    ❌ CANCEL SUBSCRIPTION
                  </button>
                ) : (
                  <div className="pixel-box-dark p-3 border border-pixel-red">
                    <div className="font-pixel text-pixel-red text-xs mb-2">CONFIRM CANCELLATION?</div>
                    <div className="text-pixel-gray text-xs mb-3">
                      Your plan will remain active until {formatDate(periodEnd)}. No refunds will be issued.
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCancel} disabled={cancelling} className="btn-red text-xs py-1 px-3">
                        {cancelling ? 'CANCELLING...' : 'YES, CANCEL'}
                      </button>
                      <button onClick={() => setShowCancelConfirm(false)} className="btn-ghost text-xs py-1 px-3">
                        KEEP PLAN
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'TOTAL SCANS', value: scans.length,   color: 'text-pixel-green' },
            { label: 'SCANS LEFT',  value: scansLeft,      color: 'text-pixel-cyan' },
            { label: 'AVG SCORE',   value: avgScore(scans), color: 'text-pixel-yellow' },
            { label: 'BUGS FOUND',  value: totalBugs(scans), color: 'text-pixel-red' },
          ].map((s) => (
            <div key={s.label} className="pixel-box-dark p-4 text-center">
              <div className={`font-pixel text-lg ${s.color} mb-1`}>{s.value}</div>
              <div className="text-pixel-gray text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── QUEST LOG ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="pixel-box py-2 inline-flex items-center gap-2">
              <span className="text-pixel-green text-xs">📜 QUEST LOG</span>
            </div>
            <Link to="/scan" className="text-pixel-green text-xs hover:text-glow-green">+ NEW QUEST</Link>
          </div>
          {loadingSub ? (
            <PixelLoader message="LOADING HISTORY..." />
          ) : scans.length === 0 ? (
            <div className="pixel-box-dark p-12 text-center">
              <div className="text-4xl mb-4">🏹</div>
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
  const scoreColor =
    score >= 80 ? 'text-pixel-green' :
    score >= 50 ? 'text-pixel-yellow' :
                  'text-pixel-red';

  const handlePdfDownload = (e) => {
    e.preventDefault();
    const pdfUrl = getReportUrl(scan.id);
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="pixel-box-dark p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-pixel-white text-xs truncate mb-1">{scan.url}</div>
        <div className="text-pixel-gray text-xs">{formatDate(scan.createdAt)}</div>
      </div>
      <div className="w-32 flex-shrink-0">
        <MpBar value={score} max={100} />
      </div>
      <div className={`font-pixel text-sm ${scoreColor} flex-shrink-0`}>{score}</div>
      <div className="flex gap-3 flex-shrink-0 items-center">
        <span className="text-pixel-red text-xs">{scan.violations ?? 0} bugs</span>
        {scan.id && (
          <button
            onClick={handlePdfDownload}
            className="text-pixel-cyan text-xs hover:underline cursor-pointer"
          >
            📄 PDF
          </button>
        )}
      </div>
    </div>
  );
    }
