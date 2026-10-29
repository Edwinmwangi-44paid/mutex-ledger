import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── tiny sparkle component ─── */
const Sparkle: React.FC<{ className?: string; char?: string; style?: React.CSSProperties }> = ({
  className = '',
  char = '✦',
  style,
}) => <span className={`sparkle-star ${className}`} style={style}>{char}</span>;

/* ─── static mock price data ─── */
const PRICES = [
  { name: 'Bitcoin',  ticker: 'BTC',  price: '$56,290.30', change: '+1.68%', pos: true,  points: '0,25 15,20 25,22 35,10 45,14 55,8 65,12 80,5'  },
  { name: 'Ethereum', ticker: 'ETH',  price: '$4,284.81',  change: '+4.36%', pos: true,  points: '0,20 10,25 25,15 35,18 50,10 60,14 75,7 80,9'   },
  { name: 'Cardano',  ticker: 'ADA',  price: '$1.88',      change: '+3.43%', pos: true,  points: '0,15 15,10 30,18 45,12 55,8 65,15 80,10'        },
  { name: 'Wax',      ticker: 'WAXP', price: '$0.97',      change: '-2.62%', pos: false, points: '0,8 15,12 30,10 45,18 60,22 75,20 80,25'        },
  { name: 'Polkadot', ticker: 'DOT',  price: '$42.22',     change: '+7.58%', pos: true,  points: '0,25 10,20 25,22 35,15 50,10 60,8 75,5 80,3'   },
];

const TICKER_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', ADA: '#0033ad', WAXP: '#ff5319', DOT: '#e6007a',
};

/* ─── Fade-in hook ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ═══════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════ */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  const goAuth = () => navigate('/auth');

  /* ── section refs for fade-in ── */
  const featRef   = useFadeIn();
  const investRef = useFadeIn();
  const supportRef = useFadeIn();
  const priceRef  = useFadeIn();
  const safeRef   = useFadeIn();
  const newsRef   = useFadeIn();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#080b12', color: '#fff', overflowX: 'hidden' }}>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; color: inherit; cursor: pointer; }

        /* Sparkle */
        .sparkle-star {
          position: absolute; pointer-events: none; user-select: none;
          color: #fff; opacity: 0.7;
          animation: sp-pulse 3s ease-in-out infinite;
        }
        @keyframes sp-pulse {
          0%,100%{ opacity:.4; transform:scale(1); }
          50%    { opacity:1;  transform:scale(1.35); }
        }

        /* Float */
        @keyframes float-y {
          0%,100%{ transform:translateY(0) rotate(-2deg); }
          50%    { transform:translateY(-18px) rotate(2deg); }
        }
        @keyframes float-slow {
          0%,100%{ transform:translateY(0); }
          50%    { transform:translateY(-14px); }
        }

        /* Fade-in sections */
        .fade-sect {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity .7s ease, transform .7s ease;
        }

        /* Scrollbar */
        ::-webkit-scrollbar{ width:6px; } ::-webkit-scrollbar-track{ background:#0d1120; }
        ::-webkit-scrollbar-thumb{ background:#1e2d45; border-radius:3px; }

        /* Price table row hover */
        .price-row:hover{ background:rgba(255,255,255,.03); }

        /* Card hover */
        .feat-card{
          background:#0d1120; border:1px solid #1e2d45; border-radius:12px; padding:28px 24px;
          transition:border-color .3s, transform .3s, box-shadow .3s;
        }
        .feat-card:hover{ border-color:rgba(0,212,255,.35); transform:translateY(-5px); box-shadow:0 14px 44px rgba(0,0,0,.5); }

        /* Nav link */
        .nav-lnk{ font-size:13.5px; font-weight:500; color:#8b97b4; transition:color .2s; }
        .nav-lnk:hover{ color:#fff; }

        /* Btn primary */
        .btn-p{
          display:inline-block; padding:12px 28px;
          background:linear-gradient(135deg,#00b4d8,#0077ff);
          color:#fff; font-weight:700; font-size:14px; border-radius:6px; cursor:pointer;
          border:none; font-family:inherit;
          transition:opacity .2s, transform .2s, box-shadow .2s;
          box-shadow:0 4px 24px rgba(0,180,216,.35);
        }
        .btn-p:hover{ opacity:.88; transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,180,216,.5); }

        /* Btn outline */
        .btn-o{
          display:inline-block; padding:10px 24px;
          border:1.5px solid #4a5568; color:#fff; font-weight:600; font-size:13px;
          border-radius:6px; cursor:pointer; background:transparent;
          transition:border-color .2s, background .2s; font-family:inherit;
        }
        .btn-o:hover{ border-color:#00d4ff; background:rgba(0,212,255,.06); }

        /* Card-link */
        .card-lnk{ font-size:13px; font-weight:600; color:#00d4ff; transition:color .2s; }
        .card-lnk:hover{ color:#fff; }

        /* Trade now */
        .trade-lnk{ font-size:13px; font-weight:600; color:#00d4ff; white-space:nowrap; transition:color .2s; }
        .trade-lnk:hover{ color:#fff; }

        /* Email input wrap */
        .email-wrap{
          display:flex; max-width:420px; margin:0 auto;
          border:1.5px solid #1e2d45; border-radius:8px; overflow:hidden;
          background:#111827; transition:border-color .2s;
        }
        .email-wrap:focus-within{ border-color:#00d4ff; }
        .email-inp{
          flex:1; padding:14px 16px; background:transparent; border:none; outline:none;
          color:#fff; font-size:14px; font-family:inherit;
        }
        .email-inp::placeholder{ color:#2d3748; }
        .email-btn{
          padding:14px 18px; background:linear-gradient(135deg,#00b4d8,#0077ff);
          border:none; color:#fff; font-size:18px; cursor:pointer;
          transition:opacity .2s; font-family:inherit;
        }
        .email-btn:hover{ opacity:.85; }

        /* Footer email */
        .foot-email-wrap{
          display:flex; border:1px solid #1e2d45; border-radius:6px; overflow:hidden;
          background:#111827; max-width:260px;
        }
        .foot-email-inp{
          flex:1; padding:10px 12px; background:transparent; border:none; outline:none;
          color:#fff; font-size:13px; font-family:inherit;
        }
        .foot-email-inp::placeholder{ color:#2d3748; }
        .foot-email-btn{
          padding:10px 14px; background:linear-gradient(135deg,#00b4d8,#0077ff);
          border:none; color:#fff; cursor:pointer; font-size:16px; transition:opacity .2s;
        }
        .foot-email-btn:hover{ opacity:.85; }

        /* mobile nav */
        .mobile-nav{
          display:none; flex-direction:column; gap:16px;
          padding:16px 24px; background:rgba(8,11,18,.98);
          border-bottom:1px solid #1e2d45;
          position:absolute; top:60px; left:0; right:0; z-index:99;
        }
        .mobile-nav.open{ display:flex; }

        /* grid */
        .feat-grid{
          display:grid; grid-template-columns:repeat(3,1fr); gap:20px;
        }
        .two-col{
          display:grid; grid-template-columns:1fr 1fr; align-items:center; gap:60px;
        }
        @media(max-width:900px){
          .feat-grid{ grid-template-columns:1fr; }
          .two-col{ grid-template-columns:1fr; gap:36px; }
          .hide-mob{ display:none !important; }
          .nav-desktop{ display:none !important; }
          .hamburger-btn{ display:flex !important; }
        }
        @media(max-width:600px){
          .hero-h1{ font-size:36px !important; }
          .sect-h2{ font-size:26px !important; }
          .price-tbl td{ padding:12px 8px; font-size:11px; }
          .chart-col{ display:none; }
        }

        /* Hamburger */
        .hamburger-btn{
          display:none; flex-direction:column; gap:5px;
          background:none; border:none; cursor:pointer; padding:4px; margin-left:auto;
        }
        .hamburger-btn span{
          display:block; width:22px; height:2px; background:#8b97b4; border-radius:2px;
          transition:background .2s;
        }
        .hamburger-btn:hover span{ background:#fff; }

        /* Learn more */
        .learn-lnk{ display:inline-block; font-size:14px; font-weight:600; color:#00d4ff; margin-bottom:36px; transition:color .2s; }
        .learn-lnk:hover{ color:#fff; }

        /* Policy link */
        .pol-lnk{ color:#00d4ff; font-weight:500; transition:color .2s; }
        .pol-lnk:hover{ color:#fff; }

        /* Dot */
        .nl-dot{
          width:12px; height:12px; background:linear-gradient(135deg,#ff5f9e,#a855f7);
          border-radius:50%; margin:0 auto 24px;
          box-shadow:0 0 20px rgba(168,85,247,.6);
        }
      `}</style>

      {/* ════ NAVBAR ════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(8,11,18,.97)' : 'rgba(8,11,18,.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(30,45,69,.6)',
        transition: 'background .3s',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 32 }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#00b4d8,#0077ff)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fff' }}>P</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '1.5px' }}>PESAFLIP</span>
          </a>

          {/* Desktop nav */}
          <nav className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1 }}>
            {['Buy / Sell', 'Grow', 'Markets', 'Business', 'Support'].map(l => (
              <a key={l} href="#" className="nav-lnk">{l}</a>
            ))}
          </nav>

          {/* Actions */}
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button onClick={goAuth} style={{ padding: '7px 18px', fontSize: 13, fontWeight: 600, color: '#8b97b4', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b97b4')}>
              Sign in
            </button>
            <button onClick={goAuth} className="btn-p" style={{ padding: '7px 18px', fontSize: 13 }}>Sign up</button>
          </div>

          {/* Hamburger */}
          <button className="hamburger-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile nav */}
        <div className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
          {['Buy / Sell', 'Grow', 'Markets', 'Business', 'Support'].map(l => (
            <a key={l} href="#" className="nav-lnk">{l}</a>
          ))}
          <button onClick={goAuth} className="btn-p" style={{ width: '100%' }}>Sign in / Sign up</button>
        </div>
      </header>

      {/* ════ HERO ════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 60 }}>
        {/* Glows */}
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 600, height: 500, background: 'radial-gradient(ellipse,rgba(0,180,130,.22) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 50, right: -80, width: 400, height: 400, background: 'radial-gradient(ellipse,rgba(124,58,237,.55) 0%,rgba(60,0,180,.28) 45%,transparent 75%)', borderRadius: '50%', pointerEvents: 'none', animation: 'float-slow 8s ease-in-out infinite' }} />

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />

        {/* Floating coins */}
        <div className="hide-mob" style={{ position: 'absolute', right: '7%', top: '50%', transform: 'translateY(-50%)', width: 320, animation: 'float-y 7s ease-in-out infinite', filter: 'drop-shadow(0 0 30px rgba(0,212,255,.18))' }}>
          <img src="/src/assets/coins.jpg" alt="" style={{ width: '100%', mixBlendMode: 'lighten' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          {/* CSS fallback coins */}
          <div style={{ position: 'absolute', top: 10, left: -20, width: 70, height: 70, background: 'radial-gradient(circle,#f7931a,#c67214)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', boxShadow: '0 0 24px rgba(247,147,26,.5)' }}>₿</div>
          <div style={{ position: 'absolute', bottom: 20, right: 10, width: 55, height: 55, background: 'radial-gradient(circle,#627eea,#3a4fb5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', boxShadow: '0 0 20px rgba(98,126,234,.5)' }}>Ξ</div>
          <div style={{ position: 'absolute', top: '40%', right: -10, width: 42, height: 42, background: 'radial-gradient(circle,#00b4d8,#0055aa)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', boxShadow: '0 0 16px rgba(0,180,216,.5)' }}>◎</div>
        </div>

        {/* Sparkles */}
        <Sparkle className="" char="✦" style={{ top: '15%', left: '7%', fontSize: 22, animationDelay: '0s' } as React.CSSProperties} />
        <Sparkle char="✦" style={{ top: '28%', left: '40%', fontSize: 14, animationDelay: '.8s' } as React.CSSProperties} />
        <Sparkle char="✦" style={{ top: '65%', left: '12%', fontSize: 18, animationDelay: '1.5s' } as React.CSSProperties} />
        <Sparkle char="+" style={{ top: '18%', right: '32%', fontSize: 26, opacity: .4, animationDelay: '2s', color: '#fff' } as React.CSSProperties} />
        <Sparkle char="✦" style={{ bottom: '20%', right: '20%', fontSize: 16, animationDelay: '.4s' } as React.CSSProperties} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 620, padding: '0 24px' }}>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
            We make crypto<br />clear and simple
          </h1>
          <p style={{ fontSize: 15, color: '#8b97b4', marginBottom: 32, lineHeight: 1.7 }}>
            Buy, sell, and grow your crypto with PesaFlip, the platform dedicated<br className="hide-mob" /> to every trader at every level.
          </p>
          <button onClick={goAuth} className="btn-p">Get Started</button>
        </div>
      </section>

      {/* ════ FEATURE CARDS ════ */}
      <section style={{ padding: '60px 0 80px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          <div ref={featRef} className="fade-sect feat-grid">
            {[
              { icon: '⇄', color: '#00d1ff', title: 'Trade Desk',       link: 'Get Started',      sub: 'Invest in crypto anytime, anywhere with our safe, secure, and easy to use online platform.' },
              { icon: '🖥',  color: '#a855f7', title: 'PesaFlip ATMs',   link: 'Find an ATM',       sub: 'We have thousands of ATMs located across the country where you can easily convert cash to crypto.' },
              { icon: '💼',  color: '#0ecb81', title: 'PesaFlip Wallet', link: 'Download the App', sub: 'Store your growing investments in our non-custodial wallet that gives you access to a full suite of DeFi services in one place.' },
            ].map((c, i) => (
              <article key={i} className="feat-card" style={{ transitionDelay: `${i * .12}s` }}>
                <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,.05)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontSize: 22 }}>{c.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{c.title}</h3>
                <p style={{ fontSize: 13.5, color: '#8b97b4', lineHeight: 1.65, marginBottom: 20 }}>{c.sub}</p>
                <button onClick={goAuth} className="card-lnk" style={{ background: 'none', border: 'none', fontFamily: 'inherit', padding: 0 }}>{c.link} →</button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ════ INVESTMENT PLATFORM ════ */}
      <section style={{ position: 'relative', padding: '100px 0', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -80, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse,rgba(0,100,80,.16) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div ref={investRef} className="fade-sect" style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 className="sect-h2" style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.8, marginBottom: 18 }}>
            A crypto investment platform<br />that invests in you
          </h2>
          <p style={{ fontSize: 14.5, color: '#8b97b4', marginBottom: 32, lineHeight: 1.7 }}>
            We invest more resources than any other platform in making sure great<br className="hide-mob" /> support from real people is a click away, whenever you need it.
          </p>
          <button onClick={goAuth} className="btn-p">Get Started</button>
        </div>
        <Sparkle char="✦" style={{ top: '20%', right: '10%', fontSize: 24, animationDelay: '1s' } as React.CSSProperties} />
        <Sparkle char="✦" style={{ bottom: '15%', left: '8%', fontSize: 16, animationDelay: '.3s' } as React.CSSProperties} />
      </section>

      {/* ════ 24/7 SUPPORT ════ */}
      <section style={{ position: 'relative', padding: '80px 0', overflow: 'hidden', background: 'linear-gradient(180deg,rgba(20,5,40,.55) 0%,rgba(8,11,18,0) 100%)' }}>
        <div style={{ position: 'absolute', bottom: -50, left: -80, width: 500, height: 400, background: 'radial-gradient(ellipse,rgba(200,80,0,.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div ref={supportRef} className="fade-sect two-col" style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          {/* Shield illustration */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float-slow 7s ease-in-out infinite' }}>
              <div style={{ width: 200, height: 220, background: 'linear-gradient(145deg,#ff8c00,#e65c00)', clipPath: 'polygon(50% 0%,100% 20%,100% 70%,50% 100%,0% 70%,0% 20%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(200,80,0,.5)', fontSize: 72, color: 'rgba(255,255,255,.3)' }}>$</div>
              <Sparkle char="✦" style={{ top: 20, right: 20, fontSize: 20, animationDelay: '.7s' } as React.CSSProperties} />
            </div>
          </div>
          {/* Text */}
          <div>
            <h2 className="sect-h2" style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.5, marginBottom: 18 }}>
              24/7 access to full<br />service customer<br />support
            </h2>
            <p style={{ fontSize: 14, color: '#8b97b4', marginBottom: 28, lineHeight: 1.7 }}>
              We invest more resources than any other platform in making sure great support from real people is a click away, whenever you need it.
            </p>
            <button onClick={goAuth} className="btn-o">Get Started</button>
          </div>
        </div>
      </section>

      {/* ════ PRICE TABLE ════ */}
      <section style={{ position: 'relative', padding: '100px 0 80px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 300, background: 'radial-gradient(ellipse,rgba(0,50,150,.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div ref={priceRef} className="fade-sect" style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 className="sect-h2" style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.8, marginBottom: 18 }}>
            Buy and sell with the lowest<br />fees in the industry
          </h2>
          <p style={{ fontSize: 14.5, color: '#8b97b4', marginBottom: 12, lineHeight: 1.7 }}>
            Buy and sell 150+ cryptocurrencies with 20+ fiat currencies using bank<br className="hide-mob" /> transfers or your credit/debit card.
          </p>
          <a href="#" className="learn-lnk">Learn More →</a>

          <div style={{ background: '#0d1120', border: '1px solid #1e2d45', borderRadius: 12, overflow: 'hidden' }}>
            <table className="price-tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {PRICES.map((row, i) => (
                  <tr key={i} className="price-row" style={{ borderBottom: i < PRICES.length - 1 ? '1px solid #1e2d45' : 'none' }}>
                    <td style={{ padding: '18px 20px', fontWeight: 600, fontSize: 14, textAlign: 'left', whiteSpace: 'nowrap' }}>{row.name}</td>
                    <td style={{ padding: '18px 8px', fontWeight: 700, fontSize: 13, color: TICKER_COLORS[row.ticker] || '#fff', whiteSpace: 'nowrap' }}>{row.ticker}</td>
                    <td style={{ padding: '18px 8px', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>{row.price}</td>
                    <td style={{ padding: '18px 8px', fontWeight: 700, fontSize: 13.5, color: row.pos ? '#0ecb81' : '#f6465d', whiteSpace: 'nowrap' }}>{row.change}</td>
                    <td className="chart-col" style={{ padding: '18px 12px', width: 100 }}>
                      <svg viewBox="0 0 80 30" style={{ width: 100, height: 36, display: 'block' }}>
                        <polyline points={row.points} stroke={row.pos ? '#0ecb81' : '#f6465d'} strokeWidth="1.5" fill="none" />
                      </svg>
                    </td>
                    <td style={{ padding: '18px 20px', whiteSpace: 'nowrap' }}>
                      <button onClick={goAuth} className="trade-lnk" style={{ background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>Trade Now →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ════ SAFE INVESTING ════ */}
      <section style={{ position: 'relative', padding: '80px 0 100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: -80, width: 500, height: 500, background: 'radial-gradient(ellipse,rgba(80,0,200,.13) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div ref={safeRef} className="fade-sect two-col" style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          {/* Text */}
          <div>
            <h2 className="sect-h2" style={{ fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.5, marginBottom: 18 }}>
              Take your first step<br />into safe, secure<br />crypto investing
            </h2>
            <p style={{ fontSize: 14, color: '#8b97b4', marginBottom: 28, lineHeight: 1.7, maxWidth: 380 }}>
              Seamlessly manage and grow your digital asset portfolio with institutional-grade security tools designed to protect every transaction.
            </p>
            <button onClick={goAuth} className="btn-p">Get Started</button>
          </div>
          {/* Briefcase illustration */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', animation: 'float-slow 8s ease-in-out infinite', animationDelay: '1s' }}>
              <div style={{ width: 240, height: 200, background: 'linear-gradient(145deg,#00d4ff,#0055ff)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(0,100,255,.4)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 60, height: 24, background: 'rgba(0,0,0,.3)', borderRadius: '0 0 8px 8px' }} />
                <div style={{ fontSize: 64, opacity: .4 }}>💼</div>
              </div>
              <Sparkle char="✦" style={{ top: -10, left: 10, fontSize: 20, animationDelay: '.5s' } as React.CSSProperties} />
              <Sparkle char="+" style={{ bottom: 20, right: -10, fontSize: 28, color: '#00d4ff', opacity: .35, animationDelay: '1.2s' } as React.CSSProperties} />
            </div>
          </div>
        </div>
      </section>

      {/* ════ NEWSLETTER ════ */}
      <section style={{ position: 'relative', padding: '90px 0', overflow: 'hidden', borderTop: '1px solid #1e2d45', borderBottom: '1px solid #1e2d45' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%,rgba(0,80,200,.14) 0%,transparent 60%)', pointerEvents: 'none' }} />
        <div ref={newsRef} className="fade-sect" style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div className="nl-dot" />
          <h2 className="sect-h2" style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 800, letterSpacing: -0.8, marginBottom: 12 }}>Receive transmissions</h2>
          <p style={{ fontSize: 14.5, color: '#8b97b4', marginBottom: 28, lineHeight: 1.7 }}>
            Unsubscribe at any time. <a href="#" className="pol-lnk">Privacy policy ↗</a>
          </p>
          {subscribed ? (
            <div style={{ maxWidth: 420, margin: '0 auto', padding: '14px 20px', background: 'rgba(14,203,129,.1)', border: '1px solid rgba(14,203,129,.3)', borderRadius: 8, color: '#0ecb81', fontWeight: 600, fontSize: 14 }}>
              ✓ You're subscribed! Welcome to PesaFlip.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="email-wrap" style={{ maxWidth: 420, margin: '0 auto' }}>
              <input type="email" placeholder="Email Address" className="email-inp" value={email} onChange={e => setEmail(e.target.value)} required />
              <button type="submit" className="email-btn">→</button>
            </form>
          )}
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer style={{ position: 'relative', padding: '60px 0 40px', background: 'linear-gradient(180deg,rgba(5,10,20,0) 0%,#030508 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'radial-gradient(ellipse at 20% 100%,rgba(0,80,50,.18) 0%,transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1.6fr 1fr 1.8fr', gap: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg,#00b4d8,#0077ff)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#fff' }}>P</div>
              <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '1.5px' }}>PESAFLIP</span>
            </div>
            <p style={{ fontSize: 13, color: '#8b97b4', lineHeight: 1.65, marginBottom: 12, maxWidth: 280 }}>PesaFlip, the world's leading bitcoin platform, makes it easy to buy and sell bitcoin via cash, card, or bank transfer.</p>
            <p style={{ fontSize: 12.5, color: '#8b97b4', marginBottom: 14 }}>Sign up to get the latest in PesaFlip news, discounts, and more.</p>
            <form onSubmit={handleSubscribe} className="foot-email-wrap">
              <input type="email" placeholder="Email Address" className="foot-email-inp" value={email} onChange={e => setEmail(e.target.value)} />
              <button type="submit" className="foot-email-btn">→</button>
            </form>
            <p style={{ fontSize: 11.5, color: '#2d3748', marginTop: 16 }}>© 2025 PFA Holdings, LLC PesaFlip</p>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#8b97b4', marginBottom: 14 }}>Company</h4>
            <ul style={{ listStyle: 'none' }}>
              {['About', 'Careers', 'News', 'Merch'].map(l => (
                <li key={l} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: 13, color: '#8b97b4', transition: 'color .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#8b97b4')}>{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: 'transparent', marginBottom: 14 }}>—</h4>
            <ul style={{ listStyle: 'none' }}>
              {['Privacy Policy and Terms of Service', 'PesaFlip Privacy Policy', 'PesaFlip Biometrics Privacy Policy', 'PesaFlip Financial Privacy Notice', 'PesaFlip Terms of Service', 'PesaFlip Trade Desk Terms of Service'].map(l => (
                <li key={l} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: 13, color: '#8b97b4', transition: 'color .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#8b97b4')}>{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
