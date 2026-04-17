import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { getScanDetail, getReportUrl, generateRepair } from '../lib/api';
import PixelLoader from '../components/PixelLoader';

const IMPACT_STYLES = {
  critical: { badge: 'text-pixel-red border-red-500',       border: 'border-l-4 border-red-500' },
  serious:  { badge: 'text-orange-400 border-orange-500',   border: 'border-l-4 border-orange-500' },
  moderate: { badge: 'text-pixel-yellow border-yellow-500', border: 'border-l-4 border-yellow-500' },
  minor:    { badge: 'text-blue-400 border-blue-500',       border: 'border-l-4 border-blue-500' },
};

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function scoreColor(s) {
  if (s >= 80) return 'text-pixel-green';
  if (s >= 50) return 'text-pixel-yellow';
  return 'text-pixel-red';
}

function ViolationCard({ v }) {
  const [open, setOpen] = useState(false);
  const style = IMPACT_STYLES[v.impact] || IMPACT_STYLES.minor;
  return (
    <div className={`pixel-box-dark p-4 ${style.border}`}>
      <button className="w-full text-left flex items-start justify-between gap-3" onClick={() => setOpen((o) => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`font-pixel text-xs uppercase px-2 py-0.5 bg-pixel-dark border ${style.badge}`}>{v.impact}</span>
            {v.wcagCriteria && <span className="text-pixel-gray text-xs">{v.wcagCriteria}</span>}
          </div>
          <div className="text-pixel-white text-xs font-semibold">{v.id}</div>
        </div>
        <span className="text-pixel-gray text-xs flex-shrink-0 mt-1">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2 border-t border-pixel-dark pt-3">
          {(v.help || v.description) && <div className="text-pixel-white text-xs font-semibold mb-1">{v.help || v.description}</div>}
          {v.howToFix && <div className="text-pixel-gray text-xs mt-2">{v.howToFix}</div>}
          {v.affectedElements > 0 && <div className="text-pixel-gray text-xs mt-2">{v.affectedElements} element{v.affectedElements !== 1 ? 's' : ''} affected</div>}
          {v.helpUrl && <a href={v.helpUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-pixel-cyan hover:underline">Learn more ↗</a>}
        </div>
      )}
    </div>
  );
}

export default function ScanDetail() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [repairing, setRepairing] = useState(false);
  const [repair, setRepair] = useState(null);
  const [repairError, setRepairError] = useState('');

  useEffect(() => {
    if (!id) return;
    getScanDetail(id).then(setScan).catch(() => setError('Could not load scan detail.')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PixelLoader message="LOADING QUEST DATA..." />;
  if (error || !scan) return (
    <div className="min-h-screen bg-pixel-bg flex items-center justify-center">
      <div className="pixel-box p-8 text-center">
        <div className="text-4xl mb-4">💀</div>
        <div className="font-pixel text-pixel-red text-xs mb-4">{error || 'Scan not found.'}</div>
        <Link to="/dashboard" className="btn-green text-xs py-2 px-4">← BACK TO QUEST LOG</Link>
      </div>
    </div>
  );

  const result = scan.result || {};
  const violations = result.violations || [];
  const summary = result.summary || {};
  const score = scan.score ?? result.complianceScore ?? 0;

  const handlePdfDownload = () => {
    const a = document.createElement('a');
    a.href = getReportUrl(scan.id);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRepair = async () => {
    setRepairing(true); setRepairError(''); setRepair(null);
    try { const data = await generateRepair(scan.url, violations); setRepair(data); }
    catch (err) { setRepairError(err?.response?.data?.error || 'Repair failed.'); }
    finally { setRepairing(false); }
  };

  const SUMMARY_LABELS = [
    { key: 'total', label: 'TOTAL', color: 'text-pixel-white' },
    { key: 'critical', label: 'CRITICAL', color: 'text-pixel-red' },
    { key: 'serious', label: 'SERIOUS', color: 'text-orange-400' },
    { key: 'moderate', label: 'MODERATE', color: 'text-pixel-yellow' },
    { key: 'minor', label: 'MINOR', color: 'text-blue-400' },
    { key: 'passed', label: 'PASSED', color: 'text-pixel-green' },
    { key: 'incomplete', label: 'INCOMPLETE', color: 'text-pixel-gray' },
  ];

  return (
    <div className="min-h-screen bg-pixel-bg py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/dashboard" className="text-pixel-green text-xs hover:underline">← BACK TO QUEST LOG</Link>
        <div className="pixel-box p-6">
          <div className="text-pixel-gray text-xs mb-1 truncate">{scan.url}</div>
          <div className="text-pixel-gray text-xs mb-4">{formatDate(scan.createdAt)}</div>
          <div className="flex items-center gap-6">
            <div className={`font-pixel text-5xl ${scoreColor(score)}`}>{score}</div>
            <div className="flex-1">
              <div className="text-pixel-gray text-xs mb-1">COMPLIANCE SCORE</div>
              <div className="hp-bar-track">
                <div className="hp-bar-fill" style={{ width: `${score}%`, backgroundColor: score >= 80 ? '#00ff41' : score >= 50 ? '#ffd700' : '#ff3333' }} />
              </div>
            </div>
          </div>
        </div>
        {Object.keys(summary).length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {SUMMARY_LABELS.map(({ key, label, color }) => summary[key] !== undefined ? (
              <div key={key} className="pixel-box-dark p-2 text-center">
                <div className={`font-pixel text-sm ${color}`}>{summary[key]}</div>
                <div className="text-pixel-gray text-xs mt-1" style={{ fontSize: '0.6rem' }}>{label}</div>
              </div>
            ) : null)}
          </div>
        )}
        <div className="flex gap-3 flex-wrap">
          <button onClick={handlePdfDownload} className="btn-green text-xs py-2 px-4">📄 DOWNLOAD REPORT</button>
          {session && violations.length > 0 && (
            <button onClick={handleRepair} disabled={repairing} className="btn-yellow text-xs py-2 px-4">
              {repairing ? '⚙ REPAIRING...' : '⚡ AUTO REPAIR'}
            </button>
          )}
        </div>
        {repair && (
          <div className="pixel-box p-6 space-y-4">
            <div className="font-pixel text-pixel-green text-xs mb-2">✅ REPAIR COMPLETE — {repair.fixesCount ?? repair.fixesApplied?.length ?? 0} FIXES APPLIED</div>
            {Array.isArray(repair.fixesApplied) && repair.fixesApplied.map((fix, i) => <div key={i} className="text-pixel-green text-xs">✓ {fix}</div>)}
            {repair.diff && <pre className="bg-pixel-dark border border-pixel-green text-pixel-green text-xs p-3 overflow-x-auto whitespace-pre-wrap max-h-64">{repair.diff}</pre>}
          </div>
        )}
        {repairError && <div className="pixel-box-dark p-3 border border-red-500"><span className="text-pixel-red text-xs">{repairError}</span></div>}
        {violations.length > 0 ? (
          <div className="space-y-3">
            <div className="font-pixel text-pixel-red text-xs mb-2">⚠ {violations.length} VIOLATION{violations.length !== 1 ? 'S' : ''} FOUND</div>
            {violations.map((v, i) => <ViolationCard key={v.id || i} v={v} />)}
          </div>
        ) : (
          <div className="pixel-box-dark p-8 text-center border border-pixel-green">
            <div className="text-4xl mb-3">🏆</div>
            <div className="font-pixel text-pixel-green text-xs mb-1">No violations found!</div>
            <div className="text-pixel-gray text-xs">This page passes all checked accessibility rules.</div>
          </div>
        )}
      </div>
    </div>
  );
}
