import { useState } from 'react';
import { useSession } from '../lib/auth';
import { runScan, getReportUrl, generateRepair } from '../lib/api';

const impactColor = {
  critical: 'text-red-400 border-red-500',
  serious: 'text-orange-400 border-orange-500',
  moderate: 'text-yellow-400 border-yellow-500',
  minor: 'text-blue-400 border-blue-500',
};

export default function Scan() {
  const { session } = useSession();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [repairing, setRepairing] = useState(false);
  const [repair, setRepair] = useState(null);
  const [repairError, setRepairError] = useState('');

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setScanning(true);
    setError('');
    setResult(null);
    setRepair(null);
    setRepairError('');
    try {
      const data = await runScan(url.trim());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleRepair = async () => {
    if (!result?.violations?.length) return;
    setRepairing(true);
    setRepairError('');
    setRepair(null);
    try {
      const data = await generateRepair(result.url || url, result.violations);
      setRepair(data);
    } catch (err) {
      setRepairError(err.response?.data?.error || 'Auto-fix failed. Please try again.');
    } finally {
      setRepairing(false);
    }
  };

  const downloadRepaired = () => {
    if (!repair?.repairedHtml) return;
    const blob = new Blob([repair.repairedHtml], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'repaired.html';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const scoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-2">⚔ WCAG Scanner</h1>
          <p className="text-gray-400">Scan any URL for accessibility violations</p>
        </div>

        {/* Scan Form */}
        <form onSubmit={handleScan} className="mb-8">
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              disabled={scanning}
            />
            <button
              type="submit"
              disabled={scanning || !url.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {scanning ? '⚡ Scanning...' : '🔍 Scan'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-500 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold mb-1">Compliance Score</h2>
                  <p className="text-gray-400 text-sm truncate max-w-md">{result.url || url}</p>
                </div>
                <div className={`text-5xl font-black ${scoreColor(result.complianceScore)}`}>
                  {result.complianceScore ?? '--'}
                </div>
              </div>

              {/* Summary */}
              {result.summary && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {Object.entries(result.summary).map(([impact, count]) => (
                    <div key={impact} className="bg-gray-900 rounded-lg p-3 text-center">
                      <div className={`text-2xl font-bold ${impactColor[impact]?.split(' ')[0] || 'text-gray-300'}`}>{count}</div>
                      <div className="text-gray-400 text-xs capitalize">{impact}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-5 flex-wrap">
                {result.scanId && (
                  <a
                    href={getReportUrl(result.scanId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    📄 Download PDF Report
                  </a>
                )}
                {session && result.violations?.length > 0 && (
                  <button
                    onClick={handleRepair}
                    disabled={repairing}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {repairing ? '⚙ Fixing...' : '🔧 AUTO-FIX'}
                  </button>
                )}
              </div>
            </div>

            {/* Repair Result */}
            {repairError && (
              <div className="bg-red-900/40 border border-red-500 rounded-lg p-4 text-red-300">
                {repairError}
              </div>
            )}

            {repair && (
              <div className="bg-gray-800 rounded-xl p-6 border border-green-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-green-400">🔧 Auto-Fix Results</h2>
                  <button
                    onClick={downloadRepaired}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    ⬇ Download Fixed HTML
                  </button>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Applied {repair.fixesCount} fix{repair.fixesCount !== 1 ? 'es' : ''} across {repair.issueCount} issue{repair.issueCount !== 1 ? 's' : ''}
                </p>
                {repair.fixesApplied?.length > 0 && (
                  <ul className="space-y-2">
                    {repair.fixesApplied.map((fix, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {repair.diff && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-200">View Diff</summary>
                    <pre className="mt-2 p-4 bg-gray-900 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto font-mono whitespace-pre-wrap">
                      {repair.diff}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Violations */}
            {result.violations?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  Violations ({result.violations.length})
                </h2>
                <div className="space-y-3">
                  {result.violations.map((v, i) => (
                    <div
                      key={i}
                      className={`bg-gray-800 rounded-xl p-5 border-l-4 ${impactColor[v.impact] || 'border-gray-500'}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded mr-2 ${impactColor[v.impact]?.split(' ')[0] || 'text-gray-400'} bg-gray-900`}>
                            {v.impact}
                          </span>
                          <span className="text-sm text-gray-400">{v.wcagCriteria || v.id}</span>
                        </div>
                        {v.helpUrl && (
                          <a href={v.helpUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-purple-400 hover:text-purple-300 shrink-0">
                            Learn more ↗
                          </a>
                        )}
                      </div>
                      <p className="font-semibold text-white mb-1">{v.help || v.description}</p>
                      {v.howToFix && (
                        <p className="text-sm text-gray-400 mt-2">{v.howToFix}</p>
                      )}
                      {v.affectedElements > 0 && (
                        <p className="text-xs text-gray-500 mt-2">{v.affectedElements} element{v.affectedElements !== 1 ? 's' : ''} affected</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.violations?.length === 0 && (
              <div className="bg-green-900/30 border border-green-600 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-green-400 font-bold text-lg">No violations found!</p>
                <p className="text-gray-400 text-sm mt-1">This page passes all checked accessibility rules.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
