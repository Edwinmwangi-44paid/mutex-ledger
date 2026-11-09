import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  BarChart2,
  Layers,
  Flame,
} from 'lucide-react';


interface MatchDetailsProps {
  apiBase: string;
}

export const MatchDetailsPage: React.FC<MatchDetailsProps> = ({ apiBase }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshingMatch, setIsRefreshingMatch] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'predictions' | 'stats' | 'h2h'>('ai');
  const [isRefreshingAI, setIsRefreshingAI] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const pollingRef = useRef<any>(null);

  useEffect(() => {
    fetchMatch();
  }, [id]);

  // Polling for live match updates (every 20s if live)
  useEffect(() => {
    if (data?.fixture?.status === 'LIVE' || data?.fixture?.status === 'HT') {
      pollingRef.current = setInterval(() => {
        fetchMatch(true);
      }, 20000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [id, data?.fixture?.status]);

  const fetchMatch = async (isBackground = false) => {
    if (!id) return;
    if (!isBackground) setLoading(true);
    else setIsRefreshingMatch(true);

    try {
      const res = await fetch(`${apiBase}/sports/fixtures/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefreshedAt(new Date());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setIsRefreshingMatch(false);
    }
  };

  const handleRunDeepAnalysis = async () => {
    if (!id) return;
    setIsRefreshingAI(true);
    try {
      const res = await fetch(`${apiBase}/sports/fixtures/${id}/ai-deep-analysis`, {
        method: 'POST',
      });
      if (res.ok) {
        const newAnalysis = await res.json();
        setData((prev: any) => ({
          ...prev,
          ai_analysis: newAnalysis,
        }));
      }
    } catch {
      /* ignore */
    } finally {
      setIsRefreshingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400">Loading comprehensive match intelligence...</p>
      </div>
    );
  }

  if (!data || !data.fixture) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Match Not Found</h2>
        <button
          onClick={() => navigate('/sports')}
          className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-xs font-semibold"
        >
          Return to Match Centre
        </button>
      </div>
    );
  }

  const { fixture, statistics, ai_analysis, h2h } = data;
  const isLive = fixture.status === 'LIVE' || fixture.status === 'HT';

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/sports')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#3E4FFF]" />
          <span>Back to Match Centre</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block font-mono">
            Synced: {lastRefreshedAt.toLocaleTimeString()}
          </div>
          <button
            onClick={() => fetchMatch(true)}
            disabled={isRefreshingMatch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#151922] hover:bg-gray-50 dark:hover:bg-[#1C222E] border border-black/[0.08] dark:border-[#232936] text-gray-800 dark:text-gray-200 shadow-sm transition-all"
            title="Refresh Match Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#3E4FFF] ${isRefreshingMatch ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Match Hero Scoreboard - Micro-1 Polished */}
      <div className="relative rounded-3xl overflow-hidden micro-card p-6 md:p-10 shadow-xl border border-black/[0.08] dark:border-white/[0.08]">
        <div className="flex flex-col items-center justify-center text-center space-y-6 relative z-10">
          {/* League and Venue info */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            {fixture.league.logo && (
              <img src={fixture.league.logo} alt="" className="w-4 h-4 object-contain" />
            )}
            <span className="text-gray-900 dark:text-gray-200 font-bold">{fixture.league.name}</span>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <span>{fixture.venue || 'Arena'}</span>
            {isLive && (
              <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>{fixture.status === 'HT' ? 'HALF TIME' : `LIVE ${fixture.elapsed_minutes || 45}'`}</span>
              </span>
            )}
          </div>

          {/* Teams and Scores Banner */}
          <div className="w-full max-w-2xl grid grid-cols-3 items-center">
            {/* Home Team */}
            <div className="flex flex-col items-center space-y-2.5">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-[#3E4FFF]/20 blur group-hover:bg-[#3E4FFF]/30 transition duration-300" />
                <img
                  src={fixture.home_team.logo}
                  alt={fixture.home_team.name}
                  className="relative w-16 h-16 md:w-20 md:h-20 object-contain p-2.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm"
                />
              </div>
              <span className="text-sm md:text-base font-bold text-gray-900 dark:text-white tracking-tight">
                {fixture.home_team.name}
              </span>
              <div className="flex items-center gap-1">
                {h2h.home_form.map((res: string, idx: number) => (
                  <span
                    key={idx}
                    className={`w-4 h-4 rounded-md text-[9px] font-bold flex items-center justify-center text-white font-mono shadow-sm ${
                      res === 'W' ? 'bg-emerald-500' : res === 'D' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>

            {/* Score / Kickoff */}
            <div className="flex flex-col items-center">
              {fixture.status === 'SCHEDULED' ? (
                <div className="space-y-1.5">
                  <div className="text-xl md:text-2xl font-black text-gray-400 dark:text-gray-500 tracking-widest font-mono">
                    VS
                  </div>
                  <div className="text-xs text-[#3E4FFF] font-bold px-2.5 py-0.5 rounded-full bg-[#3E4FFF]/10 border border-[#3E4FFF]/25 font-mono">
                    {new Date(fixture.kickoff_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl md:text-5xl font-black text-gray-950 dark:text-white tracking-tight font-mono">
                    {fixture.home_score} - {fixture.away_score}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest font-mono">
                    {fixture.status === 'HT' ? 'Half Time' : (fixture.status === 'FT' ? 'Full Time' : `Live Minute ${fixture.elapsed_minutes || 45}'`)}
                  </div>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center space-y-2.5">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur group-hover:bg-indigo-500/30 transition duration-300" />
                <img
                  src={fixture.away_team.logo}
                  alt={fixture.away_team.name}
                  className="relative w-16 h-16 md:w-20 md:h-20 object-contain p-2.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm"
                />
              </div>
              <span className="text-sm md:text-base font-bold text-gray-900 dark:text-white tracking-tight">
                {fixture.away_team.name}
              </span>
              <div className="flex items-center gap-1">
                {h2h.away_form.map((res: string, idx: number) => (
                  <span
                    key={idx}
                    className={`w-4 h-4 rounded-md text-[9px] font-bold flex items-center justify-center text-white font-mono shadow-sm ${
                      res === 'W' ? 'bg-emerald-500' : res === 'D' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Compact Inline Goalscorers & Match Events Timeline */}
          {data.events_timeline && data.events_timeline.length > 0 && (
            <div className="w-full max-w-3xl pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center justify-between pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Live Match Timeline &amp; Goalscorers</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {data.events_timeline.length} Recorded Events
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {data.events_timeline.slice(0, 6).map((ev: any, idx: number) => {
                  const isGoal = ev.type?.toLowerCase().includes('goal') || ev.text?.includes('⚽') || ev.text?.includes('Goal');
                  const isCard = ev.type?.toLowerCase().includes('card') || ev.text?.includes('🟨') || ev.text?.includes('🟥');
                  const isSub = ev.type?.toLowerCase().includes('sub') || ev.text?.includes('🔄');

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all border ${
                        isGoal
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 shadow-sm'
                          : isCard
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                          : isSub
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200'
                          : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="shrink-0 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                        {ev.time || `${ev.minute}'`}
                      </span>
                      <span className="truncate flex-1 font-medium text-[11px]">
                        {ev.text || `${ev.type?.toUpperCase()}: ${ev.player || ev.team}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white/70 dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.05] rounded-2xl backdrop-blur-md overflow-x-auto shadow-sm">
        {[
          { id: 'ai', label: 'AI Deep Analysis', icon: Sparkles },
          { id: 'predictions', label: 'All Prediction Markets', icon: Layers },
          { id: 'stats', label: 'Match Statistics', icon: BarChart2 },
          { id: 'h2h', label: 'Head to Head', icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#3E4FFF] text-white shadow-md shadow-[#3E4FFF]/25 font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AI DEEP ANALYSIS */}
      {activeTab === 'ai' && ai_analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl micro-card p-5 space-y-2 border border-black/[0.08] dark:border-white/[0.08]">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Poisson Most Likely Result</span>
              <div className="text-2xl font-black text-[#3E4FFF] dark:text-[#8D9BFF]">
                {ai_analysis.most_likely_outcome}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Predicted score: <span className="text-gray-950 dark:text-white font-bold font-mono">{ai_analysis.predicted_score}</span>
              </p>
            </div>

            <div className="rounded-2xl micro-card p-5 space-y-2 border border-black/[0.08] dark:border-white/[0.08]">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Both Teams To Score (BTTS)</span>
              <div className="text-2xl font-black text-gray-950 dark:text-white font-mono">
                {ai_analysis.btts_probability}%
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Expected Goal Range: <span className="text-gray-950 dark:text-white font-bold">{ai_analysis.predicted_goals_range}</span>
              </p>
            </div>

            <div className="rounded-2xl micro-card p-5 space-y-2 border border-black/[0.08] dark:border-white/[0.08]">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Engine Confidence</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {ai_analysis.confidence_level}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Version: <span className="text-gray-950 dark:text-white font-bold font-mono">{ai_analysis.engine_version}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl micro-card p-6 space-y-4 border border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">1X2 Match Probabilities</h3>
              <button
                onClick={handleRunDeepAnalysis}
                disabled={isRefreshingAI}
                className="flex items-center gap-1.5 text-xs text-[#3E4FFF] dark:text-[#8D9BFF] hover:underline font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAI ? 'animate-spin' : ''}`} />
                <span>Re-simulate Poisson Matrix</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-center space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold truncate">{fixture.home_team.name} Win</div>
                <div className="text-xl font-bold text-gray-950 dark:text-white font-mono">
                  {ai_analysis.probabilities_1x2.home_win}%
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-center space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Draw</div>
                <div className="text-xl font-bold text-amber-500 dark:text-amber-400 font-mono">
                  {ai_analysis.probabilities_1x2.draw}%
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] text-center space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold truncate">{fixture.away_team.name} Win</div>
                <div className="text-xl font-bold text-gray-950 dark:text-white font-mono">
                  {ai_analysis.probabilities_1x2.away_win}%
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl micro-card p-6 space-y-4 border border-black/[0.08] dark:border-white/[0.08]">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Tactical Summary &amp; Key Factors</h3>
            <p className="text-xs text-gray-800 dark:text-gray-300 leading-relaxed bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-xl border border-black/[0.08] dark:border-white/[0.08]">
              {ai_analysis.tactical_summary}
            </p>
            <div className="space-y-2">
              {ai_analysis.key_factors.map((factor: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3E4FFF] mt-1.5 shrink-0" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL PREDICTION MARKETS */}
      {activeTab === 'predictions' && ai_analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ai_analysis.market_predictions.map((pred: any) => (
            <div
              key={pred.id}
              className="rounded-2xl micro-card p-5 space-y-3 border border-black/[0.08] dark:border-white/[0.08]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {pred.category} • {pred.market_name}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    pred.confidence === 'HIGH'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {pred.confidence} CONFIDENCE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900 dark:text-white">{pred.selection}</span>
                <span className="text-lg font-black text-[#3E4FFF] dark:text-[#8D9BFF] font-mono">{pred.probability_pct}%</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-normal">{pred.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MATCH STATISTICS COMPARISON GRID */}
      {activeTab === 'stats' && (
        <div className="rounded-2xl micro-card p-6 md:p-8 space-y-6 border border-black/[0.08] dark:border-white/[0.08] shadow-sm relative overflow-hidden">
          {/* Subtle Refresh Skeleton Overlay */}
          {isRefreshingMatch && (
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-20 transition-opacity">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#12151E] border border-black/[0.08] dark:border-white/[0.08] shadow-md text-xs font-semibold text-[#3E4FFF]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing live telemetry...</span>
              </div>
            </div>
          )}

          {/* Header Row with Team Names & Logos */}
          <div className="flex items-center justify-between pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <img
                src={fixture.home_team.logo}
                alt={fixture.home_team.name}
                className="w-7 h-7 object-contain rounded-lg p-0.5 bg-black/[0.03] dark:bg-white/[0.04]"
              />
              <span className="font-bold text-sm text-gray-950 dark:text-white truncate max-w-[140px] sm:max-w-xs">
                {fixture.home_team.name}
              </span>
            </div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-mono">
              Live Comparative Metrics
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-gray-950 dark:text-white truncate max-w-[140px] sm:max-w-xs text-right">
                {fixture.away_team.name}
              </span>
              <img
                src={fixture.away_team.logo}
                alt={fixture.away_team.name}
                className="w-7 h-7 object-contain rounded-lg p-0.5 bg-black/[0.03] dark:bg-white/[0.04]"
              />
            </div>
          </div>

          {/* Comprehensive Statistics Comparison Bars */}
          <div className="space-y-4">
            {[
              {
                label: 'Ball Possession (%)',
                home: statistics?.home_possession ?? 50,
                away: statistics?.away_possession ?? 50,
                unit: '%',
                icon: '⚽',
              },
              {
                label: 'Total Shots',
                home: statistics?.home_shots_total ?? 0,
                away: statistics?.away_shots_total ?? 0,
              },
              {
                label: 'Shots on Target',
                home: statistics?.home_shots_on_target ?? 0,
                away: statistics?.away_shots_on_target ?? 0,
              },
              {
                label: 'Shots off Target',
                home: statistics?.home_shots_off_target ?? Math.max(0, (statistics?.home_shots_total ?? 0) - (statistics?.home_shots_on_target ?? 0)),
                away: statistics?.away_shots_off_target ?? Math.max(0, (statistics?.away_shots_total ?? 0) - (statistics?.away_shots_on_target ?? 0)),
              },
              {
                label: 'Dangerous Attacks',
                home: statistics?.home_dangerous_attacks ?? 42,
                away: statistics?.away_dangerous_attacks ?? 36,
              },
              {
                label: 'Total Attacks',
                home: statistics?.home_attacks ?? 85,
                away: statistics?.away_attacks ?? 74,
              },
              {
                label: 'Corner Kicks',
                home: statistics?.home_corners ?? 0,
                away: statistics?.away_corners ?? 0,
              },
              {
                label: 'Yellow Cards (🟨)',
                home: statistics?.home_yellow_cards ?? 0,
                away: statistics?.away_yellow_cards ?? 0,
              },
              {
                label: 'Red Cards (🟥)',
                home: statistics?.home_red_cards ?? 0,
                away: statistics?.away_red_cards ?? 0,
              },
              {
                label: 'Fouls Committed',
                home: statistics?.home_fouls ?? 0,
                away: statistics?.away_fouls ?? 0,
              },
              {
                label: 'Offsides',
                home: statistics?.home_offsides ?? 1,
                away: statistics?.away_offsides ?? 2,
              },
              {
                label: 'Expected Goals (xG)',
                home: statistics?.home_xg ?? 0.0,
                away: statistics?.away_xg ?? 0.0,
              },
            ].map((stat, idx) => {
              const hVal = Number(stat.home);
              const aVal = Number(stat.away);
              const total = hVal + aVal || 1;
              const hPct = Math.round((hVal / total) * 100);
              const aPct = 100 - hPct;

              return (
                <div key={idx} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={`font-mono text-sm ${hVal > aVal ? 'text-[#3E4FFF] font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {stat.home}{stat.unit || ''}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-medium text-[11px] uppercase tracking-wider">
                      {stat.label}
                    </span>
                    <span className={`font-mono text-sm ${aVal > hVal ? 'text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {stat.away}{stat.unit || ''}
                    </span>
                  </div>
                  {/* Dual comparative progress bar */}
                  <div className="w-full bg-black/[0.06] dark:bg-white/[0.06] h-2 rounded-full overflow-hidden flex gap-0.5">
                    <div
                      style={{ width: `${stat.unit === '%' ? hVal : hPct}%` }}
                      className="bg-gradient-to-r from-[#3E4FFF] to-[#5E6DFF] h-full rounded-l-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${stat.unit === '%' ? aVal : aPct}%` }}
                      className="bg-gradient-to-l from-indigo-500 to-indigo-400 h-full rounded-r-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: H2H & RECENT ENCOUNTERS */}
      {activeTab === 'h2h' && h2h && (
        <div className="rounded-2xl micro-card p-6 space-y-4 border border-black/[0.08] dark:border-white/[0.08]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider">
            Historical Head-to-Head Encounters
          </h3>
          <div className="grid grid-cols-3 text-center p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08]">
            <div>
              <div className="text-2xl font-black text-gray-950 dark:text-white font-mono">{h2h.home_wins}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate px-1">{fixture.home_team.name} Wins</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-500 dark:text-amber-400 font-mono">{h2h.draws}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Draws</div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-950 dark:text-white font-mono">{h2h.away_wins}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate px-1">{fixture.away_team.name} Wins</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {h2h.recent_matches.map((m: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] text-xs"
              >
                <span className="text-gray-500 dark:text-gray-400 font-mono">{m.date}</span>
                <span className="font-semibold text-gray-900 dark:text-white font-mono">
                  Score: {m.home_score} - {m.away_score}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#3E4FFF]/10 text-[#3E4FFF] dark:text-[#8D9BFF] font-bold border border-[#3E4FFF]/20">
                  {m.winner}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
