import { useState, useEffect, useRef } from 'react';
import { useSession } from '../lib/auth';
import { runScan, getReportUrl, generateRepair } from '../lib/api';

const IMPACT_STYLES = {
  critical: { badge: 'text-pixel-red border-red-500',    border: 'border-l-4 border-red-500' },
  serious:  { badge: 'text-orange-400 border-orange-500', border: 'border-l-4 border-orange-500' },
  moderate: { badge: 'text-pixel-yellow border-yellow-500', border: 'border-l-4 border-yellow-500' },
  minor:    { badge: 'text-blue-400 border-blue-500',    border: 'border-l-4 border-blue-500' },
};
const SUMMARY_LABELS = {
  total:{ label:'TOTAL', color:'text-pixel-white' }, critical:{ label:'CRITICAL', color:'text-pixel-red' },
  serious:{ label:'SERIOUS', color:'text-orange-400' }, moderate:{ label:'MODERATE', color:'text-pixel-yellow' },
  minor:{ label:'MINOR', color:'text-blue-400' }, passed:{ label:'PASSED', color:'text-pixel-green' },
  incomplete:{ label:'INCOMPLETE', color:'text-pixel-gray' },
};
const SCAN_STAGES=[
  {label:'ENTERING DUNGEON',target:18},{label:'SCOUTING THE PAGE',target:38},
  {label:'BATTLING THE DOM TREE',target:62},{label:'READING WCAG SCROLLS',target:82},
  {label:'COMPILING BATTLE REPORT',target:96},
];
const SHIMMER_CSS=[
  '@keyframes scanline{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}',
  '@keyframes blink-cursor{0%,100%{opacity:1}50%{opacity:0}}',
  '.scan-shimmer::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:scanline 1.6s ease-in-out infinite;pointer-events:none}',
  '.blink{animation:blink-cursor .9s step-end infinite}',
].join('');
function injectStyle(id,css){if(document.getElementById(id))return;const e=document.createElement('style');e.id=id;e.textContent=css;document.head.appendChild(e);}
function ScanProgressBar({progress,stageIdx,done}){
  useEffect(()=>{injectStyle('sps',SHIMMER_CSS);},[]);
  const c=done?'#22c55e':'#ffd700';
  const s=SCAN_STAGES[Math.min(stageIdx,SCAN_STAGES.length-1)];
  return(
    <div style={{background:'#0a0a0f',border:'2px solid #ffd700',padding:'24px',fontFamily:'monospace'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
        <span style={{color:'#ffd700',fontSize:13,letterSpacing:2,fontWeight:'bold'}}>⚔ WCAG DUNGEON SCAN</span>
        <span style={{color:c,fontSize:13,fontWeight:'bold'}}>{progress}%</span>
      </div>
      <div style={{width:'100%',height:22,background:'#111118',border:'1px solid #333',position:'relative',overflow:'hidden',marginBottom:14}}>
        <div style={{width:progress+'%',height:'100%',background:'linear-gradient(90deg,'+c+'cc,'+c+')',transition:'width .3s cubic-bezier(.4,0,.2,1)',position:'relative'}} className={progress>5&&!done?'scan-shimmer':''}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:progress>50?'#0a0a0f':'#ffd700',fontWeight:'bold',letterSpacing:1,pointerEvents:'none'}}>
          {'█'.repeat(Math.floor(progress/5))}{'░'.repeat(20-Math.floor(progress/5))}
        </div>
      </div>
      {!done
        ?<div style={{color:'#ffd700',fontSize:12,marginBottom:16}}>{s.label}<span className="blink" style={{marginLeft:4}}>_</span></div>
        :<div style={{color:'#22c55e',fontSize:12,marginBottom:16,fontWeight:'bold'}}>✓ SCAN COMPLETE!</div>
      }
      <div style={{display:'flex',flexDirection:'column',gap:5}}>
        {SCAN_STAGES.map((st,i)=>{const d=done||i<stageIdx;const cur=!done&&i===stageIdx;return(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:11,color:d?'#22c55e':cur?'#ffd700':'#555',transition:'color .4s'}}>
            <span style={{width:14,textAlign:'center'}}>{d?'✓':cur?'▶':'○'}</span>
            <span style={{letterSpacing:1}}>{st.label}</span>
          </div>
        );})}
      </div>
    </div>
  );
}
export default function Scan(){
  const{data:authData}=useSession(); const isLoggedIn=!!authData?.user;
  const[url,setUrl]=useState('');const[scanning,setScanning]=useState(false);
  const[result,setResult]=useState(null);const[error,setError]=useState('');
  const[repairing,setRepairing]=useState(false);const[repair,setRepair]=useState(null);
  const[repairError,setRepairError]=useState('');
  const[progress,setProgress]=useState(0);const[stageIdx,setStageIdx]=useState(0);
  const[scanDone,setScanDone]=useState(false);
  const intervalRef=useRef(null);const apiDoneRef=useRef(false);
  useEffect(()=>{
    if(!scanning)return;
    setProgress(0);setStageIdx(0);setScanDone(false);apiDoneRef.current=false;
    let cur=0;let curS=0;
    const tick=()=>{
      const st=SCAN_STAGES[curS];if(!st)return;
      const ceil=apiDoneRef.current?100:st.target;
      cur=Math.min(cur+(apiDoneRef.current?4:1),ceil);setProgress(cur);
      if(cur>=st.target&&curS<SCAN_STAGES.length-1){curS+=1;setStageIdx(curS);}
      if(cur>=100){clearInterval(intervalRef.current);setScanDone(true);}
    };
    intervalRef.current=setInterval(tick,90);
    return()=>clearInterval(intervalRef.current);
  },[scanning]);
  const handleScan=async e=>{
    e.preventDefault();if(!url.trim())return;
    setScanning(true);setError('');setResult(null);setRepair(null);setRepairError('');
    try{const data=await runScan(url.trim());apiDoneRef.current=true;await new Promise(r=>setTimeout(r,600));setResult(data);}
    catch(err){apiDoneRef.current=true;setError(err.response?.data?.error||'Scan failed.');}
    finally{setScanning(false);}
  };
  const handleRepair=async()=>{
    if(!result?.violations?.length)return;setRepairing(true);setRepairError('');setRepair(null);
    try{const data=await generateRepair(result.url||url,result.violations);setRepair(data);}
    catch(err){setRepairError(err.response?.data?.error||'Auto-fix failed.');}
    finally{setRepairing(false);}
  };
  const downloadRepaired=()=>{if(!repair?.repairedHtml)return;const blob=new Blob([repair.repairedHtml],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='repaired.html';a.click();URL.revokeObjectURL(a.href);};
  const scoreColor=s=>s>=90?'text-pixel-green':s>=70?'text-pixel-yellow':s>=50?'text-orange-400':'text-pixel-red';
  return(
    <div className="min-h-screen bg-pixel-bg py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div><h1 className="font-pixel text-pixel-green text-xl mb-1">⚔ WCAG Scanner</h1><p className="text-pixel-gray text-xs">Scan any URL for accessibility violations</p></div>
        <form onSubmit={handleScan}>
          <div className="flex gap-3">
            <input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com" className="flex-1 bg-pixel-dark border border-pixel-green px-4 py-3 text-pixel-white text-sm placeholder-pixel-gray focus:outline-none focus:ring-1 focus:ring-pixel-green font-mono" disabled={scanning}/>
            <button type="submit" disabled={scanning||!url.trim()} className="btn-green px-6 py-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed">{scanning?'⚡ Scanning...':'🔍 Scan'}</button>
          </div>
        </form>
        {scanning&&<ScanProgressBar progress={progress} stageIdx={stageIdx} done={scanDone}/>}
        {error&&<div className="pixel-box p-4 text-pixel-red text-xs font-pixel border-red-500">⚠ {error}</div>}
        {result&&(
          <div className="space-y-5">
            <div className="pixel-box p-6">
              <div className="flex items-start justify-between mb-5">
                <div><div className="font-pixel text-pixel-green text-xs mb-2">COMPLIANCE SCORE</div><div className="text-pixel-gray text-xs truncate max-w-sm">{result.url||url}</div></div>
                <div className={`font-pixel text-5xl ${scoreColor(result.complianceScore)}`}>{result.complianceScore??'--'}</div>
              </div>
              {result.summary&&<div className="grid grid-cols-4 gap-2">{Object.entries(result.summary).map(([k,v])=>{const c=SUMMARY_LABELS[k]||{label:k.toUpperCase(),color:'text-pixel-gray'};return(<div key={k} className="pixel-box-dark p-3 text-center"><div className={`font-pixel text-lg ${c.color}`}>{v}</div><div className="text-pixel-gray text-xs mt-1">{c.label}</div></div>);})}</div>}
              <div className="flex gap-3 mt-5 flex-wrap">
                {result.scanId&&<a href={getReportUrl(result.scanId)} target="_blank" rel="noopener noreferrer" className="btn-green text-xs py-2 px-4">📄 Download PDF Report</a>}
                {isLoggedIn&&result.violations?.length>0&&<button onClick={handleRepair} disabled={repairing} className="btn-yellow text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed">{repairing?'⚙ Fixing...':'🔧 AUTO-FIX HTML'}</button>}
              </div>
            </div>
            {repairError&&<div className="pixel-box p-4 text-pixel-red text-xs border-red-500">⚠ {repairError}</div>}
            {repair&&(
              <div className="pixel-box p-6">
                <div className="flex items-center justify-between mb-4"><div className="font-pixel text-pixel-green text-xs">🔧 AUTO-FIX RESULTS</div><button onClick={downloadRepaired} className="btn-green text-xs py-1 px-3">⬇ Download Fixed HTML</button></div>
                <div className="text-pixel-gray text-xs mb-4">Applied {repair.fixesCount} fix{repair.fixesCount!==1?'es':''} across {repair.issueCount} issue{repair.issueCount!==1?'s':''}</div>
                {repair.fixesApplied?.length>0&&<ul className="space-y-2 mb-4">{repair.fixesApplied.map((f,i)=><li key={i} className="flex items-start gap-2 text-xs text-pixel-white"><span className="text-pixel-green mt-0.5">✓</span><span>{f}</span></li>)}</ul>}
                {repair.diff&&<details><summary className="cursor-pointer text-xs text-pixel-gray hover:text-pixel-white font-pixel">▶ VIEW DIFF</summary><pre className="mt-2 p-4 bg-pixel-dark text-xs overflow-x-auto max-h-64 overflow-y-auto font-mono whitespace-pre-wrap text-pixel-cyan border border-pixel-green">{repair.diff}</pre></details>}
              </div>
            )}
            {result.violations?.length>0&&(
              <div>
                <div className="font-pixel text-pixel-red text-xs mb-3">⚠ VIOLATIONS FOUND ({result.violations.length})</div>
                <div className="space-y-3">{result.violations.map((v,i)=>{const st=IMPACT_STYLES[v.impact]||{badge:'text-pixel-gray border-gray-500',border:'border-l-4 border-gray-500'};return(<div key={i} className={`pixel-box-dark p-4 ${st.border}`}><div className="flex items-start justify-between gap-3 mb-2"><div className="flex items-center gap-2 flex-wrap"><span className={`font-pixel text-xs uppercase px-2 py-0.5 bg-pixel-dark border ${st.badge}`}>{v.impact}</span><span className="text-pixel-gray text-xs">{v.wcagCriteria||v.id}</span></div>{v.helpUrl&&<a href={v.helpUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-pixel-cyan hover:underline shrink-0">Learn more ↗</a>}</div><div className="text-pixel-white text-xs font-semibold mb-1">{v.help||v.description}</div>{v.howToFix&&<div className="text-pixel-gray text-xs mt-2">{v.howToFix}</div>}{v.affectedElements>0&&<div className="text-pixel-gray text-xs mt-2">{v.affectedElements} element{v.affectedElements!==1?'s':''} affected</div>}</div>);})}</div>
              </div>
            )}
            {result.violations?.length===0&&<div className="pixel-box-dark p-8 text-center border border-pixel-green"><div className="text-4xl mb-3">🎉</div><div className="font-pixel text-pixel-green text-xs mb-1">No violations found!</div><div className="text-pixel-gray text-xs">This page passes all checked accessibility rules.</div></div>}
          </div>
        )}
      </div>
    </div>
  );
}
