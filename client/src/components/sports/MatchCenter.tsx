import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Radio,
  Search,
  X,
  History,
} from 'lucide-react';

interface Fixture {
  id: string;
  sport?: string;
  league: {
    id: string;
    name: string;
    country: string;
    sport?: string;
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
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([
    { id: 'all', name: 'All Sports', icon: '🏆' },
    { id: 'football', name: 'Football', icon: '⚽' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
    { id: 'cricket', name: 'Cricket', icon: '🏏' },
    { id: 'american_football', name: 'American Football', icon: '🏈' },
    { id: 'hockey', name: 'Ice Hockey', icon: '🏒' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'baseball', name: 'Baseball', icon: '⚾' },
  ]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState<string>(urlSearch);
  const [activeSearch, setActiveSearch] = useState<string>(urlSearch);
  const navigate = useNavigate();
  const pollingRef = useRef<any>(null);

  // Sync state if URL search param changes
  useEffect(() => {
    if (urlSearch !== activeSearch) {
      setSearchInput(urlSearch);
      setActiveSearch(urlSearch);
    }
  }, [urlSearch]);

  // Initial load and filter change
  useEffect(() => {
    fetchCategories();
    fetchLeagues();
    fetchFixtures();
  }, [statusFilter, selectedSport, selectedLeague, activeSearch]);

  // Live auto-polling: 15s for live tab, 30s for general fixtures
  useEffect(() => {
    const pollInterval = statusFilter === 'live' ? 15000 : 30000;
    pollingRef.current = setInterval(() => {
      fetchFixtures(true);
    }, pollInterval);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [statusFilter, selectedSport, selectedLeague, activeSearch]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${apiBase}/sports/sports-categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories([{ id: 'all', name: 'All Sports', icon: '🏆' }, ...data]);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchLeagues = async () => {
    try {
      const url = selectedSport !== 'all' 
        ? `${apiBase}/sports/leagues?sport=${selectedSport}` 
        : `${apiBase}/sports/leagues`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeagues(data);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchFixtures = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);

    try {
      let url = `${apiBase}/sports/fixtures?`;
      if (statusFilter !== 'all') url += `status_filter=${statusFilter}&`;
      if (selectedSport !== 'all') url += `sport=${selectedSport}&`;
      if (selectedLeague !== 'all') url += `league_id=${selectedLeague}&`;
      if (activeSearch) url += `search=${encodeURIComponent(activeSearch)}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFixtures(data);
        setLastRefreshedAt(new Date());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchFixtures(true);
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
      {/* Editorial Header Banner - Micro1 Precision Engineering */}
      <div className="relative rounded-3xl overflow-hidden micro-card p-6 md:p-10 micro-glow-blue shadow-2xl">
        <div className="max-w-2xl space-y-3.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3E4FFF]/10 border border-[#3E4FFF]/25 text-[#3E4FFF] dark:text-[#8D9BFF] text-xs font-semibold shadow-inner">
            <Radio className="w-3.5 h-3.5 text-[#3E4FFF] animate-pulse" />
            <span>SportAPI.ai Live Engine &amp; Multi-Sport Synchronizer</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-950 dark:text-white tracking-tight">
            Sports Match Centre
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-[#94A3B8] leading-relaxed font-normal">
            Real-time live scores, comprehensive fixture schedules, and multi-market Poisson AI analysis across Champions League, Premier League, NBA, Volleyball, and major global tournaments.
          </p>
        </div>
      </div>

      {/* Interactive Match Search & Quick Filter Bar (replaces static live alerts) */}
      <div className="rounded-2xl micro-card p-3 sm:p-4 border border-black/[0.08] dark:border-white/[0.08] shadow-sm backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                setActiveSearch(val);
                setSearchParams((prev) => {
                  if (val.trim()) {
                    prev.set('search', val.trim());
                  } else {
                    prev.delete('search');
                  }
                  return prev;
                }, { replace: true });
              }}
              placeholder="Search by team (e.g. Arsenal, Real Madrid), league, or past match..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#3E4FFF] focus:ring-1 focus:ring-[#3E4FFF] transition-all"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setActiveSearch('');
                  setSearchParams((prev) => {
                    prev.delete('search');
                    return prev;
                  }, { replace: true });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick-Filter Shortcuts */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => {
                setStatusFilter('completed');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border border-black/[0.06] dark:border-white/[0.06]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>Past Matches</span>
            </button>

            {['Arsenal', 'Real Madrid', 'Man City', 'Bayern'].map((team) => (
              <button
                key={team}
                onClick={() => {
                  setSearchInput(team);
                  setActiveSearch(team);
                  setSearchParams((prev) => {
                    prev.set('search', team);
                    return prev;
                  }, { replace: true });
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap border ${
                  activeSearch.toLowerCase() === team.toLowerCase()
                    ? 'bg-[#3E4FFF]/15 text-[#3E4FFF] border-[#3E4FFF]/40 dark:text-[#8D9BFF]'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border-black/[0.05] dark:border-white/[0.05]'
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-x-auto pb-1 scrollbar-none backdrop-blur-md">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#3E4FFF] text-white shadow-lg shadow-[#3E4FFF]/30 font-bold border border-white/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
            </button>
          ))}
        </div>

        {/* Action Controls: Sport Category Selector & Competition Dropdown */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={selectedSport}
              onChange={(e) => {
                setSelectedSport(e.target.value);
                setSelectedLeague('all');
              }}
              className="bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.06] border border-[#3E4FFF]/50 text-xs text-[#3E4FFF] dark:text-[#8D9BFF] font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#3E4FFF] cursor-pointer shadow-sm transition-all"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#090B10] text-gray-900 dark:text-gray-200">
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] text-xs text-gray-800 dark:text-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#3E4FFF] font-semibold cursor-pointer shadow-sm transition-colors"
          >
            <option value="all" className="bg-white dark:bg-[#090B10]">All Competitions</option>
            {leagues.map((lg) => (
              <option key={lg.id} value={lg.id} className="bg-white dark:bg-[#090B10]">
                {lg.name} ({lg.country})
              </option>
            ))}
          </select>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`p-1.5 rounded-xl bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all active:scale-95 shadow-sm ${
              isRefreshing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#3E4FFF] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sync Status Info */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-1 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3E4FFF] animate-pulse" />
          <span>Live telemetry stream active ({fixtures.length} matches)</span>
        </div>
        <span>Synced: {lastRefreshedAt.toLocaleTimeString()}</span>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl micro-card animate-pulse border border-black/[0.05] dark:border-white/[0.05]"
            />
          ))}
        </div>
      ) : fixtures.length === 0 ? (
        <div className="text-center py-16 rounded-3xl micro-card space-y-3">
          <Trophy className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-300">No matches found</h3>
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
                className="group relative rounded-2xl micro-card-interactive p-4.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                {/* Match Header: League & Status */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2 truncate">
                    {f.league.logo && (
                      <img
                        src={f.league.logo}
                        alt={f.league.name}
                        className="w-4 h-4 object-contain"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    )}
                    <span className="font-semibold text-gray-800 dark:text-gray-300 truncate">
                      {f.league.name}
                    </span>
                  </div>

                  {isLive ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px] border border-rose-500/20 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span>{f.status === 'HT' ? 'HALF TIME' : `${f.elapsed_minutes || 45}'`}</span>
                    </div>
                  ) : isFT ? (
                    <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.04] font-mono">
                      Full Time
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                      <Clock className="w-3 h-3 text-[#3E4FFF]" />
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
                      <img
                        src={f.home_team.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.home_team.name)}&background=3E4FFF&color=FFFFFF&bold=true&size=128`}
                        alt={f.home_team.name}
                        className="w-7 h-7 object-contain bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-xl shrink-0 border border-black/10 dark:border-white/10 shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.home_team.name)}&background=3E4FFF&color=FFFFFF&bold=true&size=128`;
                          if (target.src !== fallbackUrl) {
                            target.src = fallbackUrl;
                          }
                        }}
                      />
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#3E4FFF] dark:group-hover:text-[#8D9BFF] transition-colors truncate">
                        {f.home_team.name}
                      </span>
                    </div>
                    {(isLive || isFT) && (
                      <span className="text-base font-extrabold text-gray-950 dark:text-white px-2 font-mono">
                        {f.home_score}
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={f.away_team.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.away_team.name)}&background=3E4FFF&color=FFFFFF&bold=true&size=128`}
                        alt={f.away_team.name}
                        className="w-7 h-7 object-contain bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-xl shrink-0 border border-black/10 dark:border-white/10 shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.away_team.name)}&background=3E4FFF&color=FFFFFF&bold=true&size=128`;
                          if (target.src !== fallbackUrl) {
                            target.src = fallbackUrl;
                          }
                        }}
                      />
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#3E4FFF] dark:group-hover:text-[#8D9BFF] transition-colors truncate">
                        {f.away_team.name}
                      </span>
                    </div>
                    {(isLive || isFT) && (
                      <span className="text-base font-extrabold text-gray-950 dark:text-white px-2 font-mono">
                        {f.away_score}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer AI Prediction Strip */}
                <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
                  {f.ai_top_outcome ? (
                    <div className="flex items-center gap-1.5 text-[#3E4FFF] dark:text-[#8D9BFF] font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-[#3E4FFF]" />
                      <span className="text-gray-500 dark:text-gray-400">AI Pick:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">{f.ai_top_outcome}</span>
                      {f.ai_top_probability && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#3E4FFF]/15 dark:bg-[#3E4FFF]/20 text-[#3E4FFF] dark:text-[#8D9BFF] font-bold border border-[#3E4FFF]/30 font-mono">
                          {f.ai_top_probability}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-[11px] font-mono">Match Details &amp; H2H</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#3E4FFF] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
