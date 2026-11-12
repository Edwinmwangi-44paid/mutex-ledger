import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  LineChart,
  Film,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface UnifiedHomeProps {
  apiBase: string;
}

export const UnifiedHome: React.FC<UnifiedHomeProps> = ({ apiBase }) => {
  const [feed, setFeed] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await fetch(`${apiBase}/discovery/feed`);
      if (res.ok) {
        const data = await res.json();
        setFeed(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-12 pb-16 animate-pulse select-none">
        {/* Skeleton Editorial Platform Hero */}
        <div className="relative rounded-3xl overflow-hidden micro-card p-8 md:p-14 border border-black/[0.06] dark:border-white/[0.06] space-y-4">
          <div className="w-40 h-6 bg-black/[0.06] dark:bg-white/[0.08] rounded-full" />
          <div className="w-3/4 max-w-xl h-12 bg-black/[0.08] dark:bg-white/[0.1] rounded-2xl" />
          <div className="w-1/2 max-w-md h-5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl" />
          <div className="flex gap-3 pt-3">
            <div className="w-36 h-10 bg-black/[0.08] dark:bg-white/[0.1] rounded-xl" />
            <div className="w-36 h-10 bg-black/[0.05] dark:bg-white/[0.06] rounded-xl" />
            <div className="w-36 h-10 bg-black/[0.05] dark:bg-white/[0.06] rounded-xl" />
          </div>
        </div>

        {/* Skeleton Tri-Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((card) => (
            <div
              key={card}
              className="rounded-3xl micro-card p-6 space-y-4 border border-black/[0.06] dark:border-white/[0.06] h-[480px]"
            >
              <div className="flex justify-between items-center pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                <div className="w-32 h-5 bg-black/[0.08] dark:bg-white/[0.1] rounded-lg" />
                <div className="w-14 h-4 bg-black/[0.05] dark:bg-white/[0.06] rounded-md" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-20 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] p-3 space-y-2 border border-black/[0.04] dark:border-white/[0.04]"
                  >
                    <div className="flex justify-between">
                      <div className="w-24 h-3 bg-black/[0.06] dark:bg-white/[0.07] rounded" />
                      <div className="w-12 h-3 bg-black/[0.06] dark:bg-white/[0.07] rounded" />
                    </div>
                    <div className="w-40 h-4 bg-black/[0.08] dark:bg-white/[0.09] rounded" />
                    <div className="w-28 h-3 bg-black/[0.05] dark:bg-white/[0.06] rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton AI Briefs */}
        <div className="rounded-3xl micro-card p-6 md:p-8 space-y-4 border border-black/[0.06] dark:border-white/[0.06]">
          <div className="w-44 h-5 bg-black/[0.08] dark:bg-white/[0.1] rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((b) => (
              <div
                key={b}
                className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] space-y-2.5 h-32"
              >
                <div className="w-16 h-4 bg-black/[0.06] dark:bg-white/[0.08] rounded" />
                <div className="w-36 h-4 bg-black/[0.08] dark:bg-white/[0.1] rounded" />
                <div className="w-full h-8 bg-black/[0.04] dark:bg-white/[0.05] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!feed) return null;

  return (
    <div className="space-y-12 pb-16">
      {/* Editorial Platform Hero - Micro-1 Hyper-Polish */}
      <div className="relative rounded-3xl overflow-hidden micro-card p-8 md:p-14 shadow-2xl">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>PesaFlip Unified Ecosystem</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-gray-950 dark:text-white tracking-tight leading-tight">
            Sports Intelligence. Market Analytics. Cinematic Discovery.
          </h1>

          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
            A cohesive digital platform delivering real-time multi-sport forecasts, non-custodial crypto market tracking, and legal streaming entertainment discovery.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => navigate('/sports')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Explore Match Centre</span>
            </button>

            <button
              onClick={() => navigate('/tradingview')}
              className="px-5 py-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-gray-800 dark:text-gray-200 border border-black/10 dark:border-white/10 font-semibold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <LineChart className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <span>TradingView Markets</span>
            </button>

            <button
              onClick={() => navigate('/entertainment')}
              className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/20 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Film className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <span>Movie Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Domain Tri-Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DOMAIN 1: SPORTS INTELLIGENCE */}
        <div className="rounded-3xl micro-card p-6 space-y-4 flex flex-col justify-between h-[520px]">
          <div className="space-y-4 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2 text-sm font-extrabold text-gray-950 dark:text-white">
                <Trophy className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Featured Matches</span>
              </div>
              <button
                onClick={() => navigate('/sports')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Container with Ultra-Thin Scrollbar */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 thin-scrollbar">
              {feed.trending_sports && feed.trending_sports.length > 0 ? (
                feed.trending_sports.map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/sports/${m.id}`)}
                    className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="truncate max-w-[160px]">{m.league}</span>
                      <span className="font-bold text-rose-500 dark:text-red-400 font-mono text-[10px]">{m.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                      <span className="truncate max-w-[190px]">{m.home_team} vs {m.away_team}</span>
                      {m.score && <span className="font-mono text-emerald-600 dark:text-emerald-400">{m.score}</span>}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span className="truncate">AI Pick: {m.ai_outcome}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] text-center text-xs text-gray-400">
                  No live fixtures in progress right now. Check Match Centre for today's match schedule.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DOMAIN 2: TRADINGVIEW INTELLIGENCE */}
        <div className="rounded-3xl micro-card p-6 space-y-4 flex flex-col justify-between h-[520px]">
          <div className="space-y-4 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2 text-sm font-extrabold text-gray-950 dark:text-white">
                <LineChart className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                <span>TradingView Markets</span>
              </div>
              <button
                onClick={() => navigate('/tradingview')}
                className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Live Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Container with Ultra-Thin Scrollbar */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 thin-scrollbar">
              {feed.crypto_highlights?.top_coins?.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => navigate('/tradingview')}
                  className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.logo}
                      alt={c.name}
                      className="w-7 h-7 rounded-full p-0.5 object-cover bg-black/[0.03] dark:bg-white/[0.05]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          c.symbol
                        )}&background=3E4FFF&color=fff&size=64`;
                      }}
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[130px]">{c.name}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                        <span>{c.symbol}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.04]">
                          {c.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-gray-900 dark:text-white">
                      ${c.price < 2 ? c.price.toFixed(4) : c.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                        c.change_24h >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      <span>{c.change_24h >= 0 ? '+' : ''}{c.change_24h}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DOMAIN 3: ENTERTAINMENT DISCOVERY */}
        <div className="rounded-3xl micro-card p-6 space-y-4 flex flex-col justify-between h-[520px]">
          <div className="space-y-4 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2 text-sm font-extrabold text-gray-950 dark:text-white">
                <Film className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                <span>Cinematic Trending</span>
              </div>
              <button
                onClick={() => navigate('/entertainment')}
                className="text-xs text-rose-500 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Discover</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 thin-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                {feed.entertainment_picks?.map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => navigate('/entertainment')}
                    className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] hover:border-rose-500/50 transition-all cursor-pointer shadow-md"
                  >
                    <img src={m.poster} alt={m.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[11px] font-bold text-white truncate">{m.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Cross-Domain Insights Section */}
      <div className="rounded-3xl micro-card p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Cross-Domain AI Briefs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {feed.ai_insights?.map((ins: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] space-y-2"
            >
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 uppercase">
                {ins.domain}
              </span>
              <h4 className="text-sm font-bold text-gray-950 dark:text-white">{ins.title}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{ins.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
