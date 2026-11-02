import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  LineChart,
  Film,
  ArrowRight,
  Check,
  ChevronDown,
  Search,
  ExternalLink,
  Shield,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'What is PesaFlip and how does it combine these domains?',
      a: 'PesaFlip is an all-in-one consumer intelligence platform. Rather than jumping between sports betting forums, cryptocurrency brokers, and movie review databases, PesaFlip aggregates real-time football match stats with Poisson AI predictions, live non-custodial crypto market performance charts, and cinematic entertainment discovery with direct legal streaming availability.',
    },
    {
      q: 'How does the AI Match Prediction Engine calculate probabilities?',
      a: 'Our engine uses a bivariate Poisson probability model combined with rolling form statistics, home advantage weights, and historical head-to-head metrics. We produce projections for 1X2, Over/Under total goals, Both Teams to Score (BTTS), and Half-Time outcomes. Every prediction communicates statistical reasoning and includes an inherent risk disclaimer.',
    },
    {
      q: 'Is PesaFlip a crypto exchange or betting site?',
      a: 'No. PesaFlip does not execute financial transactions, accept bets, process deposits, or hold customer funds. The crypto domain is purely for market analytics, price charts, volume tracking, and watchlists. The sports domain provides analytical forecasts and match stats only.',
    },
    {
      q: 'Where does entertainment streaming data come from?',
      a: 'We retrieve media metadata and authorized streaming platform availability (Netflix, Disney+, Prime Video, Apple TV+, Showmax). PesaFlip does not host or redistribute video content; we guide you directly to legitimate streaming providers.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090D] text-gray-200 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* ─── Top Global Navigation Bar ─── */}
      <header className="sticky top-0 z-50 bg-[#07090D]/85 backdrop-blur-md border-b border-[#151923]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-black text-sm shadow-sm">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-none">
                Pesa<span className="text-emerald-400">Flip</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                Intelligence Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-7 text-xs font-semibold text-gray-400">
            <a href="#sports" className="hover:text-emerald-400 transition-colors">Sports Engine</a>
            <a href="#crypto" className="hover:text-cyan-400 transition-colors">Crypto Analytics</a>
            <a href="#entertainment" className="hover:text-rose-400 transition-colors">Entertainment</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/auth')}
              className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-1.5 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero Section with Real-World Interactive Cards ─── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111622] border border-[#1E2536] text-gray-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multi-Domain Consumer Intelligence • Release 2.4</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.12]">
            One platform for live sports AI, crypto analytics, and media discovery.
          </h1>

          <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Stop switching between fragmented apps. PesaFlip unites real-time match forecasting, non-custodial crypto market tracking, and authorized streaming guides in one coherent interface.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-7 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Explore Platform Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#121620] hover:bg-[#181E2C] border border-[#202738] text-gray-300 font-semibold text-sm transition-all cursor-pointer"
            >
              Live Demo Access
            </button>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Real-time Match Telemetry</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> Non-Custodial Market Data</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-rose-400" /> Authorized Streaming Providers</span>
          </div>
        </div>

        {/* ─── Hero Visual: Interactive Mini Previews ─── */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {/* Sports Live Card */}
          <div className="rounded-2xl bg-[#0D1017] border border-[#1A202C] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-[#161B26]">
              <span className="font-semibold text-white">Premier League</span>
              <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold text-[10px] border border-red-500/20">
                LIVE 68'
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-white">
              <span>Manchester City</span>
              <span className="text-emerald-400 text-base">2</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-white">
              <span>Arsenal</span>
              <span className="text-gray-400 text-base">1</span>
            </div>
            <div className="pt-2 border-t border-[#161B26] flex items-center justify-between text-[11px]">
              <span className="text-gray-400">AI Win Probability</span>
              <span className="font-bold text-emerald-400">Man City (61%)</span>
            </div>
          </div>

          {/* Crypto Ticker Card */}
          <div className="rounded-2xl bg-[#0D1017] border border-[#1A202C] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-[#161B26]">
              <span className="font-semibold text-white">Market Asset</span>
              <span className="text-cyan-400 font-bold text-[10px]">Rank #1</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Bitcoin (BTC)</div>
                <div className="text-xs text-gray-400">$68,450.20</div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +2.45% 24h
              </span>
            </div>
            <div className="h-6 flex items-end gap-1">
              {[40, 55, 45, 65, 60, 80, 75, 90, 85, 100].map((h, i) => (
                <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-cyan-500/30 rounded-t" />
              ))}
            </div>
            <div className="pt-2 border-t border-[#161B26] flex items-center justify-between text-[11px]">
              <span className="text-gray-400">Market Dominance</span>
              <span className="font-bold text-white">56.2%</span>
            </div>
          </div>

          {/* Media Discovery Card */}
          <div className="rounded-2xl bg-[#0D1017] border border-[#1A202C] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-[#161B26]">
              <span className="font-semibold text-white">Trending Movie</span>
              <span className="text-amber-400 font-bold text-[10px]">★ 8.2</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white truncate">Project Hail Mary (2026)</div>
              <div className="text-xs text-gray-400">Sci-Fi • Adventure • Ryan Gosling</div>
            </div>
            <div className="pt-3 border-t border-[#161B26] flex items-center justify-between text-[11px]">
              <span className="text-gray-400">Legal Streaming</span>
              <span className="font-bold text-rose-400">Prime Video • Apple TV+</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Metric Strip / Platform Proof ─── */}
      <section className="border-y border-[#151923] bg-[#0A0D13] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">8+</div>
            <div className="text-xs text-gray-400 mt-1">Supported Football Leagues</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">Poisson 2.1</div>
            <div className="text-xs text-gray-400 mt-1">Mathematical AI Engine</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400">$1.34T+</div>
            <div className="text-xs text-gray-400 mt-1">Tracked Crypto Market Cap</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400">100% Legal</div>
            <div className="text-xs text-gray-400 mt-1">Authorized Streaming Links</div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: SPORTS INTELLIGENCE DEEP DIVE ─── */}
      <section id="sports" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <Trophy className="w-4 h-4" />
              <span>Sports Match Centre</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Calibrated match predictions backed by statistical models.
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              We model expected goal distributions (xG) using bivariate Poisson equations combined with rolling form metrics, home ground advantage, and historical head-to-head records.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'Multi-Market Forecasts', desc: '1X2 outcomes, Double Chance (1X, 12, X2), Over/Under 1.5 & 2.5 goals, BTTS, and Half-Time results.' },
                { title: 'Confidence Classifications', desc: 'Categorized into High, Medium, and Low confidence with explicit supporting statistical rationale.' },
                { title: 'Global & Regional Coverage', desc: 'Premier League, La Liga, Serie A, Bundesliga, Ligue 1, UEFA Champions League, and the Kenyan Premier League.' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">{item.title}</span>
                    <span className="text-gray-400 leading-normal">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0D1017] border border-[#1A202C] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400 pb-3 border-b border-[#161B26]">
              <span className="font-bold text-white">AI Prediction Breakdown</span>
              <span className="text-emerald-400 font-semibold">Engine Version 2.1</span>
            </div>
            <div className="p-4 rounded-xl bg-[#111622] border border-[#1D2433] space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-white">Home Win: 61%</span>
                <span className="text-gray-400">Draw: 22%</span>
                <span className="text-white">Away Win: 17%</span>
              </div>
              <div className="h-2 rounded-full bg-[#1A202C] flex overflow-hidden">
                <div style={{ width: '61%' }} className="bg-emerald-500 h-full" />
                <div style={{ width: '22%' }} className="bg-amber-500 h-full" />
                <div style={{ width: '17%' }} className="bg-cyan-500 h-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#111622] border border-[#1D2433]">
                <div className="text-gray-400 text-[11px]">Over 1.5 Goals</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">84.2% (High)</div>
              </div>
              <div className="p-3 rounded-lg bg-[#111622] border border-[#1D2433]">
                <div className="text-gray-400 text-[11px]">Both Teams to Score</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">58.0% (Medium)</div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 italic">
              Disclaimers included: Sports outcomes involve inherent variance and predictions do not represent guarantees.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: CRYPTO MARKET INTELLIGENCE ─── */}
      <section id="crypto" className="py-20 border-t border-[#151923] bg-[#090C11] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl bg-[#0D1017] border border-[#1A202C] p-6 space-y-4 shadow-xl order-2 lg:order-1">
            <div className="flex items-center justify-between text-xs text-gray-400 pb-3 border-b border-[#161B26]">
              <span className="font-bold text-white">BTC/USD Multi-Timeframe</span>
              <div className="flex gap-1 text-[10px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-black">7D</span>
                <span className="px-1.5 py-0.5 rounded bg-[#161B26] text-gray-400">30D</span>
                <span className="px-1.5 py-0.5 rounded bg-[#161B26] text-gray-400">1Y</span>
              </div>
            </div>
            <div className="h-40 flex items-center justify-center bg-[#07090E] rounded-xl border border-[#141824] p-3">
              <svg className="w-full h-full" viewBox="0 0 300 100">
                <path
                  d="M 0,80 Q 50,40 100,60 T 200,30 T 300,10"
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-[#111622] border border-[#1D2433]">
                <div className="text-[10px] text-gray-400">Market Cap</div>
                <div className="font-bold text-white mt-0.5">$1.34T</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111622] border border-[#1D2433]">
                <div className="text-[10px] text-gray-400">Circulating</div>
                <div className="font-bold text-white mt-0.5">19.78M BTC</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111622] border border-[#1D2433]">
                <div className="text-[10px] text-gray-400">All-Time High</div>
                <div className="font-bold text-white mt-0.5">$73,750</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest">
              <LineChart className="w-4 h-4" />
              <span>Crypto Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Pure market tracking without broker or exchange bloat.
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              No order books, trade execution slips, or deposit forms. We deliver pure market capitalization, Bitcoin dominance, 24h volume tracking, and interactive price charts across multiple timeframes.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'Interactive Multi-Timeframe Charts', desc: 'Switch instantly between 1 hour, 24 hours, 7 days, 30 days, 90 days, 1 year, and all-time.' },
                { title: 'Non-Custodial Transparency', desc: 'Track assets like BTC, ETH, SOL, XRP, and ADA without signing custody agreements or KYC.' },
                { title: 'Personalized Watchlists', desc: 'Pin your favorite cryptocurrencies to monitor 24h price movements at a glance.' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">{item.title}</span>
                    <span className="text-gray-400 leading-normal">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: ENTERTAINMENT DISCOVERY DEEP DIVE ─── */}
      <section id="entertainment" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-widest">
              <Film className="w-4 h-4" />
              <span>Cinematic Media Discovery</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Discover what to watch and where to stream legally.
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Find trending theatrical movies, top-rated television shows, director credits, cast biographies, and official trailers, accompanied by direct legal streaming availability.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'Zero Piracy or Copyright Infringement', desc: 'PesaFlip directs you straight to authorized streaming providers (Netflix, Prime Video, Disney+, Apple TV+, Showmax).' },
                { title: 'Comprehensive Metadata', desc: 'Ratings, synopses, runtimes, cast, and similar title recommendations.' },
                { title: 'Cinematic Visual Layout', desc: 'Full-bleed backdrops and poster carousels tailored for media discovery.' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="w-5 h-5 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">{item.title}</span>
                    <span className="text-gray-400 leading-normal">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0D1017] border border-[#1A202C] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400 pb-3 border-b border-[#161B26]">
              <span className="font-bold text-white">Streaming Availability Hub</span>
              <span className="text-rose-400 font-semibold">Verified Providers</span>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Netflix', status: 'Subscription', region: 'Global' },
                { name: 'Prime Video', status: 'Included with Prime', region: 'Global' },
                { name: 'Disney+', status: 'Subscription', region: 'Selected Markets' },
                { name: 'Apple TV+', status: 'Rent or Buy 4K', region: 'Global' },
              ].map((prov, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#111622] border border-[#1D2433] text-xs">
                  <span className="font-bold text-white">{prov.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{prov.status}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: UNIFIED ARCHITECTURE & OMNI-SEARCH ─── */}
      <section id="architecture" className="py-20 border-t border-[#151923] bg-[#0A0D13] px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-12">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Unified Shared Core
          </span>
          <h2 className="text-3xl font-black text-white">How the Three Domains Communicate</h2>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            Each domain maintains dedicated services and data models on the backend, linked through our global search gateway and cross-domain AI briefing layer.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0D1017] border border-[#1A202C] space-y-3">
            <Search className="w-5 h-5 text-emerald-400" />
            <h4 className="text-base font-bold text-white">Global Omni-Search</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Press ⌘K anywhere. Searching for "Arsenal" returns fixtures and xG stats; searching "Solana" gives price charts; searching "Avatar" shows streaming availability.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#0D1017] border border-[#1A202C] space-y-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h4 className="text-base font-bold text-white">AI Cross-Domain Briefs</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Contextual AI summaries highlight key match edges, network volume movements, and audience anticipation scores without fabricated stats.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#0D1017] border border-[#1A202C] space-y-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h4 className="text-base font-bold text-white">Decoupled Architecture</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Built on clean modular services. Adding new leagues, market aggregators, or metadata providers does not require rebuilding frontend components.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: FREQUENTLY ASKED QUESTIONS (FAQ) ─── */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">FAQ</span>
          <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-gray-400">Everything you need to know about the platform.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#0D1017] border border-[#1A202C] overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-white cursor-pointer hover:text-emerald-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    activeFaq === idx ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 text-xs text-gray-400 leading-relaxed border-t border-[#141824] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA Banner ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0E131C] to-[#0A0D14] border border-emerald-900/30 p-8 sm:p-12 text-center space-y-5 shadow-2xl">
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Ready to experience PesaFlip?
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            Sign in now to access the live Match Centre, interactive cryptocurrency market charts, and movie discovery feeds.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm inline-flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Modern Platform Footer ─── */}
      <footer className="mt-auto border-t border-[#151923] bg-[#06080C] px-6 py-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-gray-300">PesaFlip Intelligence</span>
            <span>•</span>
            <span>Sports Match Centre</span>
            <span>•</span>
            <span>Crypto Markets</span>
            <span>•</span>
            <span>Media Discovery</span>
          </div>

          <div className="flex items-center space-x-5">
            <a href="#sports" className="hover:text-gray-300">Sports</a>
            <a href="#crypto" className="hover:text-gray-300">Crypto</a>
            <a href="#entertainment" className="hover:text-gray-300">Entertainment</a>
            <span
              className="cursor-pointer text-emerald-400 font-semibold hover:underline"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
