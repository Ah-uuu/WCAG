import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { runScan } from '../lib/api';
import HpBar from '../components/HpBar';
import { ScanLoader } from '../components/PixelLoader';
import { BugSprite, ShieldSprite } from '../components/PixelSprite';

const IMPACT_BADGE = {
  critical: { label: '💀 CRITICAL', cls: 'border-pixel-red text-pixel-red' },
  serious:  { label: '⚠ SERIOUS',   cls: 'border-pixel-red text-pixel-red' },
  moderate: { label: '△ MODERATE',  cls: 'border-pixel-yellow text-pixel-yellow' },
  minor:    { label: '◦ MINOR',     cls: 'border-pixel-border text-pixel-gray' },
};

export default function Scan() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [url, setUrl]           = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState({});
  const inputRef = useRef();

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
    setError(''); setResult(null); setScanning(true);
    try {
      const data = await runScan(target);
      setResult(data);
    } catch (err) {
      if (err?.response?.status === 401) { navigate('/sign-in?redirect=/scan'); return; }
      if (err?.response?.status === 429) {
        setError('⚔ SCAN LIMIT REACHED! UPGRADE YOUR CLASS TO CONTINUE.');
      } else {
        setError('✗ ' + (err?.response?.data?.error || err?.message || 'SCAN FAILED').toUpperCase());
      }
    } finally { setScanning(false); }
  };

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const score = result?.score ?? 0;
  const violations = result?.violations ?? [];
  const critical = violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length;
  const moderate = violations.filter(v => v.impact === 'moderate').length;
  const minor    = violations.filter(v => v.impact === 'minor').length;

  return (
    <div className="min-h-screen bg-pixel-bg py-8 px-4 relative overflow-hidden">
      <div className="scanlines fixed inset-0 pointer-events-none z-0 opacity-30" />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block pixel-box px-6 py-2 mb-4">
            <span className="font-pixel text-pixel-green text-xs">⚔ DUNGEON GATE ⚔</span>
          </div>
          <p className="text-pixel-gray text-xs">Enter a URL to begin your accessibility quest</p>
        </div>

        <form onSubmit={handleScan} className="pixel-box p-6 mb-8">
          <label className="block font-pixel text-pixel-gray text-xs mb-3">ENTER DUNGEON URL</label>
          <div className="flex gap-3 flex-col sm:flex-row">
            <input ref={inputRef} type="text" className="pixel-input flex-1"
              placeholder="https://example.com" value={url}
              onChange={(e) => setUrl(e.target.value)} disabled={scanning} spellCheck={false} autoComplete="off" />
            <button type="submit" disabled={scanning || !url.trim()} className="btn-green text-xs py-3 px-6 whitespace-nowrap">
              {scanning ? '⚔ SCANNING...' : '▶ START SCAN'}
            </button>
          </div>
          {!session && (
            <p className="text-pixel-gray text-xs mt-3">
              💡 <span className="text-pixel-yellow">GUEST:</span> You can scan without an account.{' '}
              <button type="button" onClick={() => navigate('/sign-up')} className="text-pixel-green underline">Sign up free</button>
              {' '}to save history.
            </p>
          )}
        </form>

        {scanning && <div className="pixel-box-dark p-8 text-center"><ScanLoader url={url} /></div>}

        {error && !scanning && (
          <div className="pixel-box p-6 mb-6 border-pixel-red">
            <div className="text-pixel-red text-xs font-pixel mb-2">QUEST FAILED</div>
            <div className="text-pixel-red text-xs">{error}</div>
            {error.includes('LIMIT') && (
              <button onClick={() => navigate('/pricing')} className="btn-yellow text-xs py-2 px-4 mt-4">★ UPGRADE CLASS</button>
            )}
          </div>
        )}

        {result && !scanning && (
          <div className="space-y-6">
            <div className="pixel-box p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-shrink-0 text-center">
                  <div className={`font-pixel text-4xl mb-1 ${score >= 80 ? 'text-pixel-green text-glow-green' : score >= 50 ? 'text-pixel-yellow text-glow-yellow' : 'text-pixel-red'}`}>{score}</div>
                  <div className="text-pixel-gray text-xs">/ 100</div>
                  <div className="text-pixel-gray text-xs mt-1">SCORE</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-pixel-white text-xs truncate mb-1">{result.url || url}</div>
                  <div className="mb-3"><HpBar value={score} max={100} /></div>
                  <div className={`font-pixel text-xs ${score >= 80 ? 'text-pixel-green' : score >= 50 ? 'text-pixel-yellow' : 'text-pixel-red'}`}>
                    {score >= 80 ? '★ DUNGEON CLEARED!' : score >= 50 ? '⚠ PARTIALLY ACCESSIBLE' : '💀 DUNGEON BOSS ACTIVE'}
                  </div>
                </div>
                {result.scanId && (
                  <a href={`/api/report/pdf/${result.scanId}`} target="_blank" rel="noreferrer"
                    className="btn-cyan text-xs py-2 px-4 flex-shrink-0">📜 DOWNLOAD REPORT</a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="pixel-box-dark p-4 text-center"><div className="font-pixel text-pixel-red text-xl mb-1">{critical}</div><div className="text-pixel-red text-xs">💀 CRITICAL</div></div>
              <div className="pixel-box-dark p-4 text-center"><div className="font-pixel text-pixel-yellow text-xl mb-1">{moderate}</div><div className="text-pixel-yellow text-xs">△ MODERATE</div></div>
              <div className="pixel-box-dark p-4 text-center"><div className="font-pixel text-pixel-gray text-xl mb-1">{minor}</div><div className="text-pixel-gray text-xs">◦ MINOR</div></div>
            </div>

            {violations.length > 0 ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="pixel-box px-4 py-2 inline-flex items-center gap-2">
                    <BugSprite size={16} color="#ff4444" />
                    <span className="font-pixel text-pixel-red text-xs">ENEMIES FOUND ({violations.length})</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {violations.map((v, i) => {
                    const badge = IMPACT_BADGE[v.impact] || IMPACT_BADGE.minor;
                    const isOpen = expanded[v.id || i];
                    return (
                      <div key={v.id || i} className="pixel-box-dark">
                        <button className="w-full text-left p-4 flex items-start gap-3 hover:bg-pixel-dark transition-colors"
                          onClick={() => toggleExpand(v.id || i)}>
                          <BugSprite size={14} color={v.impact === 'critical' || v.impact === 'serious' ? '#ff4444' : v.impact === 'moderate' ? '#ffd700' : '#888'} className="flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`font-pixel text-xs border px-2 py-0.5 ${badge.cls}`}>{badge.label}</span>
                              <span className="text-pixel-white text-xs truncate">{v.id}</span>
                            </div>
                            <div className="text-pixel-gray text-xs leading-relaxed">{v.description}</div>
                          </div>
                          <span className="text-pixel-gray text-xs flex-shrink-0 ml-2">{isOpen ? '▲' : '▼'}</span>
                        </button>
                        {isOpen && (
                          <div className="border-t border-pixel-border px-4 pb-4 pt-3 space-y-3">
                            {v.help && <div><div className="font-pixel text-pixel-yellow text-xs mb-1">FIX HINT</div><div className="text-pixel-gray text-xs leading-relaxed">{v.help}</div></div>}
                            {v.helpUrl && <a href={v.helpUrl} target="_blank" rel="noreferrer" className="text-pixel-cyan text-xs underline">📖 VIEW WCAG RULE</a>}
                            {v.nodes && v.nodes.length > 0 && (
                              <div>
                                <div className="font-pixel text-pixel-gray text-xs mb-2">AFFECTED ELEMENTS ({v.nodes.length})</div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {v.nodes.slice(0, 5).map((node, ni) => (
                                    <div key={ni} className="bg-pixel-bg p-2 border border-pixel-border">
                                      <code className="text-pixel-green text-xs break-all">{node.html?.slice(0, 200) || node.target?.join(', ')}</code>
                                      {node.failureSummary && <div className="text-pixel-gray text-xs mt-1">{node.failureSummary}</div>}
                                    </div>
                                  ))}
                                  {v.nodes.length > 5 && <div className="text-pixel-gray text-xs">... and {v.nodes.length - 5} more</div>}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="pixel-box p-8 text-center">
                <div className="flex justify-center mb-4"><ShieldSprite size={48} color="#00ff41" /></div>
                <div className="font-pixel text-pixel-green text-xs mb-2 text-glow-green">★ DUNGEON CLEARED! ★</div>
                <div className="text-pixel-gray text-xs">No accessibility enemies detected!</div>
              </div>
            )}

            <div className="text-center pt-4">
              <button onClick={() => { setResult(null); setUrl(''); inputRef.current?.focus(); }} className="btn-ghost text-xs py-3 px-6">
                ↩ SCAN ANOTHER URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
