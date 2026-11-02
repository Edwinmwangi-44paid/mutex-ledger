import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Sparkles,
  ChevronRight,
  } from 'lucide-react';

interface Fixture {
  id: string;
  league: {
    id: string;
    name: string;
    country: string;
    logo?: string;
  };
  home_team: {
    id: string;
    name: string;
    logo?: string;
    short_name?: string;
  };
  away_team: {
    id: string;
    name: string;
    logo?: string;
    short_name?: string;
  };
  kickoff_time: string;
  status: string;
  elapsed_minutes?: number;
  home_score: number;
  away_score: number;
  venue?: string;
  round_name?: string;
  is_popular: boolean;
  ai_top_outcome?: string;
  ai_top_probability?: number;
}

interface MatchCenterProps {
  apiBase: string;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({ apiBase }) => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeagues();
    fetchFixtures();
  }, [statusFilter, selectedLeague, searchQuery]);

  const fetchLeagues = async () => {
    try {
      const res = await fetch(`${apiBase}/sports/leagues`);
      if (res.ok) {
        const data = await res.json();
        setLeagues(data);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchFixtures = async () => {
    setLoading(true);
    try {
      let url = `${apiBase}/sports/fixtures?`;
      if (status!== 'all') url += `status_filter=${status}&`;
      if (selectedLeague !== 'all') url += `league_id=${selectedLeague}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFixtures(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const formatKickoff = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMatchDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-950 via-[#101720] to-[#0D0F12] border border-emerald-900/30 p-6 md:p-8">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Probabilistic Engine v2.1 Active</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Sports Match Centre
          </h1>
          <p className="text-sm md:text-base text-gray-300">
            Real-time live scores, comprehensive fixture schedules, and multi-market Poisson AI analysis across global leagues and regional tournaments.
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E232E] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Fixtures' },
            { id: 'live', label: 'Live Now', badge: 'LIVE' },
            { id: 'today', label: 'Today' },
            { id: 'tomorrow', label: 'Tomorrow' },
            { id: 'next_7_days', label: 'Next 7 Days' },
            { id: 'completed', label: 'Finished' },
            { id: 'popular', label: 'Popular Clashes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                status=== tab.id
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-[#151922] text-gray-400 hover:text-white hover:bg-[#1C222E]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              )}
            </button>
          ))}
        </div>

        {/* & League Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="bg-[#151922] border border-[#232936] text-xs text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Competitions</option>
            {leagues.map((lg) => (
              <option key={lg.id} value={lg.id}>
                {lg.name} ({lg.country})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl bg-[#141820] animate-pulse border border-[#1F2430]"
            />
          ))}
        </div>
      ) : fixtures.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-[#12161E] border border-[#1E232E] space-y-3">
          <Trophy className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-semibold text-gray-300">No matches found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your search criteria or switching to a different competition filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixtures.map((f) => {
            const isLive = f.status === 'LIVE' || f.status === 'HT';
            const isFT = f.status === 'FT';

            return (
              <div
                key={f.id}
                onClick={() => navigate(`/sports/${f.id}`)}
                className="group relative rounded-2xl bg-[#13161E] hover:bg-[#181D27] border border-[#202532] hover:border-emerald-500/40 p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between"
              >
                {/* Match Header: League & Status */}
                <div className="flex items-center justify-between text-xs text-gray-400 pb-3 border-b border-[#1E232F]">
                  <div className="flex items-center gap-2 truncate">
                    {f.league.logo && (
                      <img
                        src={f.league.logo}
                        alt={f.league.name}
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span className="font-medium text-gray-300 truncate">
                      {f.league.name}
                    </span>
                  </div>

                  {isLive ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 font-bold text-[11px] border border-red-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span>{f.status === 'HT' ? 'HT' : `${f.elapsed_minutes}'`}</span>
                    </div>
                  ) : isFT ? (
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Full Time
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>
                        {formatMatchDate(f.kickoff_time)} • {formatKickoff(f.kickoff_time)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scoreboard & Team Clashes */}
                <div className="py-4 space-y-3">
                  {/* Home Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {f.home_team.logo ? (
                        <img
                          src={f.home_team.logo}
                          alt={f.home_team.name}
                          className="w-7 h-7 object-contain bg-white/5 p-1 rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#1E232F] flex items-center justify-center text-xs font-bold text-gray-400">
                          {f.home_team.short_name || f.home_team.name.slice(0, 3)}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-100 group-hover:text-emerald-300 transition-colors">
                        {f.home_team.name}
                      </span>
                    </div>
                    {(isLive || isFT) && (
                      <span className="text-base font-extrabold text-white px-2">
                        {f.home_score}
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {f.away_team.logo ? (
                        <img
                          src={f.away_team.logo}
                          alt={f.away_team.name}
                          className="w-7 h-7 object-contain bg-white/5 p-1 rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#1E232F] flex items-center justify-center text-xs font-bold text-gray-400">
                          {f.away_team.short_name || f.away_team.name.slice(0, 3)}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-100 group-hover:text-emerald-300 transition-colors">
                        {f.away_team.name}
                      </span>
                    </div>
                    {(isLive || isFT) && (
                      <span className="text-base font-extrabold text-white px-2">
                        {f.away_score}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer AI Prediction Strip */}
                <div className="pt-3 border-t border-[#1E232F] flex items-center justify-between text-xs">
                  {f.ai_top_outcome ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-gray-400">AI Pick:</span>
                      <span className="text-white font-semibold">{f.ai_top_outcome}</span>
                      {f.ai_top_probability && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          {f.ai_top_probability}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-[11px]">Match Details &amp; H2H</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
