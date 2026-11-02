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
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400">Assembling multi-domain intelligence feed...</p>
      </div>
    );
  }

  if (!feed) return null;

  return (
    <div className="space-y-12 pb-16">
      {/* Editorial Platform Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#121824] via-[#0F131C] to-[#0A0D12] border border-[#202738] p-8 md:p-12 shadow-2xl">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PesaFlip Unified Ecosystem</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Sports Intelligence. Market Analytics. Cinematic Discovery.
          </h1>

          <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-2xl">
            A cohesive digital platform delivering real-time AI football match forecasts, non-custodial crypto market tracking, and legal streaming entertainment discovery.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/sports')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>Explore Match Centre</span>
            </button>

            <button
              onClick={() => navigate('/crypto')}
              className="px-5 py-2.5 rounded-xl bg-[#1A202E] hover:bg-[#222A3D] text-gray-200 border border-[#2B354A] font-semibold text-xs flex items-center gap-2 transition-all"
            >
              <LineChart className="w-4 h-4 text-cyan-400" />
              <span>Crypto Markets</span>
            </button>

            <button
              onClick={() => navigate('/entertainment')}
              className="px-5 py-2.5 rounded-xl bg-[#1A202E] hover:bg-[#222A3D] text-gray-200 border border-[#2B354A] font-semibold text-xs flex items-center gap-2 transition-all"
            >
              <Film className="w-4 h-4 text-rose-400" />
              <span>Movie Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Domain Tri-Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DOMAIN 1: SPORTS INTELLIGENCE */}
        <div className="rounded-3xl bg-[#12151E] border border-[#202636] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E232E]">
              <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>Featured Matches</span>
              </div>
              <button
                onClick={() => navigate('/sports')}
                className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {feed.trending_sports.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/sports/${m.id}`)}
                  className="p-3 rounded-2xl bg-[#161B26] hover:bg-[#1C2230] border border-[#232A3B] transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{m.league}</span>
                    <span className="font-bold text-red-400">{m.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{m.home_team} vs {m.away_team}</span>
                    {m.score && <span>{m.score}</span>}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Pick: {m.ai_outcome}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DOMAIN 2: CRYPTO INTELLIGENCE */}
        <div className="rounded-3xl bg-[#12151E] border border-[#202636] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E232E]">
              <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                <LineChart className="w-4 h-4 text-cyan-400" />
                <span>Crypto Market Leaders</span>
              </div>
              <button
                onClick={() => navigate('/crypto')}
                className="text-xs text-cyan-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {feed.crypto_highlights?.top_coins?.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => navigate('/crypto')}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#161B26] hover:bg-[#1C2230] border border-[#232A3B] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img src={c.logo} alt={c.name} className="w-7 h-7 rounded-full" />
                    <div>
                      <div className="text-xs font-bold text-white">{c.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase">{c.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">${c.price.toLocaleString()}</div>
                    <div
                      className={`text-[10px] font-semibold ${
                        c.change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {c.change_24h >= 0 ? '+' : ''}{c.change_24h}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DOMAIN 3: ENTERTAINMENT DISCOVERY */}
        <div className="rounded-3xl bg-[#12151E] border border-[#202636] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E232E]">
              <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                <Film className="w-4 h-4 text-rose-400" />
                <span>Cinematic Trending</span>
              </div>
              <button
                onClick={() => navigate('/entertainment')}
                className="text-xs text-rose-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Discover</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {feed.entertainment_picks?.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => navigate('/entertainment')}
                  className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#161B26] border border-[#232A3B] hover:border-rose-500/50 transition-all cursor-pointer shadow-md"
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

      {/* AI Cross-Domain Insights Section */}
      <div className="rounded-3xl bg-gradient-to-r from-[#121926] via-[#151421] to-[#12161E] border border-indigo-900/30 p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Cross-Domain AI Briefs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {feed.ai_insights?.map((ins: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#0D1017]/80 border border-[#1E2330] space-y-2"
            >
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                {ins.domain}
              </span>
              <h4 className="text-sm font-bold text-white">{ins.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{ins.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
