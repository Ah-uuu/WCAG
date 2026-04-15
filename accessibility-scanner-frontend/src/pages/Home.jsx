import { Link } from 'react-router-dom';
import { ShieldSprite, SwordSprite, CrownSprite } from '../components/PixelSprite';

const FEATURES = [
  { icon: '⚔️', title: 'WCAG HUNTER', desc: 'Automatically detect AA/AAA accessibility violations', color: 'pixel-box' },
  { icon: '📜', title: 'PDF REPORT', desc: 'Generate detailed quest reports for your client', color: 'pixel-box-cyan' },
  { icon: '⚡', title: 'FAST SCAN', desc: 'Complete dungeon crawl in under 30 seconds', color: 'pixel-box-yellow' },
  { icon: '🏆', title: 'SCORE SYSTEM', desc: 'Get an accessibility score from 0 to 100', color: 'pixel-box-purple' },
];

const STATS = [
  { value: '10,000+', label: 'WEBSITES SCANNED' },
  { value: '500+',    label: 'BUGS DEFEATED' },
  { value: '99%',     label: 'UPTIME' },
  { value: 'WCAG 2.1', label: 'STANDARD' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-pixel-bg relative overflow-hidden">
      <PixelBackground />
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-block pixel-box px-8 py-2 mb-8">
          <span className="text-pixel-green text-xs tracking-widest">★ PRESS START TO PLAY ★</span>
        </div>
        <div className="mb-6">
          <h1 className="font-pixel text-pixel-green text-glow-green leading-loose">
            <span className="block text-2xl sm:text-3xl mb-2">ACCESS</span>
            <span className="block text-3xl sm:text-4xl text-pixel-yellow text-glow-yellow">SCAN</span>
          </h1>
        </div>
        <p className="font-pixel text-pixel-gray text-xs leading-loose max-w-lg mx-auto mb-4">
          THE ULTIMATE WCAG ACCESSIBILITY<br />DUNGEON CRAWLER FOR YOUR WEBSITE
        </p>
        <p className="text-pixel-gray text-xs mb-10">Defeat accessibility bugs. Level up your site. Achieve AA compliance.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/scan" className="btn-green text-xs py-4 px-8 inline-flex items-center gap-3">
            <span>▶ START FREE SCAN</span>
          </Link>
          <Link to="/pricing" className="btn-ghost text-xs py-4 px-8">VIEW PLANS</Link>
        </div>
        <div className="flex justify-center gap-6 mb-16">
          <div className="animate-float" style={{ animationDelay: '0s' }}><ShieldSprite size={48} color="#00ff41" /></div>
          <div className="animate-float" style={{ animationDelay: '0.5s' }}><SwordSprite size={48} color="#ffd700" /></div>
          <div className="animate-float" style={{ animationDelay: '1s' }}><CrownSprite size={48} color="#ffd700" /></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="pixel-box-dark p-4 text-center">
              <div className="font-pixel text-pixel-yellow text-glow-yellow text-sm mb-2">{s.value}</div>
              <div className="text-pixel-gray text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-block pixel-box px-6 py-2 mb-4">
            <span className="text-pixel-cyan text-xs">QUEST ABILITIES</span>
          </div>
          <h2 className="font-pixel text-pixel-white text-sm">WHAT YOUR HERO CAN DO</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className={`${f.color} p-6 text-center group hover:scale-105 transition-transform`}>
              <div className="text-3xl mb-4 group-hover:animate-bounce">{f.icon}</div>
              <div className="font-pixel text-xs text-pixel-yellow mb-3">{f.title}</div>
              <div className="text-pixel-gray text-xs leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-pixel text-pixel-white text-sm">HOW TO PLAY</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '🌐', title: 'ENTER URL', desc: 'Paste your website URL into the dungeon gate' },
            { step: '02', icon: '⚔️', title: 'START SCAN', desc: 'Our crawler explores every pixel of your site' },
            { step: '03', icon: '📜', title: 'GET REPORT', desc: 'Download your quest log PDF and fix the bugs' },
          ].map((item) => (
            <div key={item.step} className="pixel-box p-6 text-center relative">
              <div className="absolute -top-3 -left-3 bg-pixel-green text-pixel-bg font-pixel text-xs w-8 h-8 flex items-center justify-center">
                {item.step}
              </div>
              <div className="text-3xl mb-4 mt-2">{item.icon}</div>
              <div className="font-pixel text-xs text-pixel-green mb-2">{item.title}</div>
              <div className="text-pixel-gray text-xs leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="pixel-box p-10">
          <div className="text-4xl mb-4 animate-bounce">🏆</div>
          <h2 className="font-pixel text-pixel-yellow text-glow-yellow text-sm mb-4">READY TO LEVEL UP?</h2>
          <p className="text-pixel-gray text-xs mb-8 leading-loose">
            Join thousands of developers who already use AccessScan<br/>to make their websites more accessible.
          </p>
          <Link to="/sign-up" className="btn-yellow text-xs py-4 px-10">★ CREATE FREE ACCOUNT ★</Link>
        </div>
      </section>
    </div>
  );
}

function PixelBackground() {
  const dots = Array.from({ length: 20 }, (_, i) => i);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {dots.map((i) => (
        <div key={i} className="absolute w-1 h-1 bg-pixel-green opacity-20"
          style={{ left: `${(i * 17 + 5) % 100}%`, top: `${(i * 23 + 10) % 100}%`, animation: `blink ${1 + (i % 3) * 0.5}s step-end ${i * 0.3}s infinite` }}
        />
      ))}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
    </div>
  );
}
