import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  BarChart2,
  Layers,
} from 'lucide-react';

interface MatchDetailsProps {
  apiBase: string;
}

export const MatchDetailsPage: React.FC<MatchDetailsProps> = ({ apiBase }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ai' | 'predictions' | 'stats' | 'h2h'>('ai');
  const [isRefreshingAI, setIsRefreshingAI] = useState(false);

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/sports/fixtures/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
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
      {/* Back Button */}
      <button
        onClick={() => navigate('/sports')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Match Centre</span>
      </button>

      {/* Match Hero Scoreboard */}
      <div className="rounded-2xl bg-gradient-to-b from-[#161B26] to-[#10131B] border border-[#232938] p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          {/* League and Venue info */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            {fixture.league.logo && (
              <img src={fixture.league.logo} alt="" className="w-4 h-4 object-contain" />
            )}
            <span>{fixture.league.name}</span>
            <span>•</span>
            <span>{fixture.venue || 'Stadium'}</span>
            {isLive && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[10px] animate-pulse">
                LIVE {fixture.elapsed_minutes}'
              </span>
            )}
          </div>

          {/* Teams and Scores Banner */}
          <div className="w-full max-w-2xl grid grid-cols-3 items-center">
            {/* Home Team */}
            <div className="flex flex-col items-center space-y-2">
              <img
                src={fixture.home_team.logo}
                alt={fixture.home_team.name}
                className="w-16 h-16 md:w-20 md:h-20 object-contain p-2 rounded-2xl bg-white/5 border border-white/10"
              />
              <span className="text-sm md:text-base font-bold text-white">
                {fixture.home_team.name}
              </span>
              <div className="flex items-center gap-1">
                {h2h.home_form.map((res: string, idx: number) => (
                  <span
                    key={idx}
                    className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center text-white ${
                      res === 'W' ? 'bg-emerald-500' : res === 'D' ? 'bg-amber-500' : 'bg-red-500'
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
                <div className="space-y-1">
                  <div className="text-xl md:text-2xl font-black text-gray-400 tracking-widest">
                    VS
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold">
                    {new Date(fixture.kickoff_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl md:text-5xl font-black text-white tracking-tight">
                    {fixture.home_score} - {fixture.away_score}
                  </div>
                  <div className="text-[11px] text-gray-400 uppercase font-bold tracking-widest">
                    {fixture.status}
                  </div>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center space-y-2">
              <img
                src={fixture.away_team.logo}
                alt={fixture.away_team.name}
                className="w-16 h-16 md:w-20 md:h-20 object-contain p-2 rounded-2xl bg-white/5 border border-white/10"
              />
              <span className="text-sm md:text-base font-bold text-white">
                {fixture.away_team.name}
              </span>
              <div className="flex items-center gap-1">
                {h2h.away_form.map((res: string, idx: number) => (
                  <span
                    key={idx}
                    className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center text-white ${
                      res === 'W' ? 'bg-emerald-500' : res === 'D' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="flex items-center gap-2 border-b border-[#1E232E] pb-2">
        {[
          { id: 'ai', label: 'AI Match Analysis', icon: Sparkles },
          { id: 'predictions', label: 'Prediction Markets', icon: Layers },
          { id: 'stats', label: 'Match Statistics', icon: BarChart2 },
          { id: 'h2h', label: 'Head-to-Head & Form', icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-[#151922] text-gray-400 hover:text-white hover:bg-[#1C222E]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AI MATCH ANALYSIS */}
      {activeTab === 'ai' && ai_analysis && (
        <div className="space-y-6">
          {/* AI Banner Card */}
          <div className="rounded-2xl bg-gradient-to-r from-[#111C18] to-[#121620] border border-emerald-500/30 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Probabilistic Model ({ai_analysis.engine_version})</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  Most Likely Outcome: <span className="text-emerald-400">{ai_analysis.most_likely_outcome}</span>
                </h3>
              </div>

              <button
                onClick={handleRunDeepAnalysis}
                disabled={isRefreshingAI}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAI ? 'animate-spin' : ''}`} />
                <span>Rerun Deep AI Analysis</span>
              </button>
            </div>

            {/* 1X2 Probabilities Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-300">
                <span>{fixture.home_team.name}: {ai_analysis.probabilities_1x2.home_win}%</span>
                <span>Draw: {ai_analysis.probabilities_1x2.draw}%</span>
                <span>{fixture.away_team.name}: {ai_analysis.probabilities_1x2.away_win}%</span>
              </div>
              <div className="h-3 w-full bg-[#1A1F2B] rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${ai_analysis.probabilities_1x2.home_win}%` }}
                  className="bg-emerald-500 h-full"
                />
                <div
                  style={{ width: `${ai_analysis.probabilities_1x2.draw}%` }}
                  className="bg-amber-500 h-full"
                />
                <div
                  style={{ width: `${ai_analysis.probabilities_1x2.away_win}%` }}
                  className="bg-cyan-500 h-full"
                />
              </div>
            </div>

            {/* Tactical Explanation */}
            <div className="p-4 rounded-xl bg-[#0D1017] border border-[#1C212E] space-y-2">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Tactical Breakdown
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {ai_analysis.tactical_summary}
              </p>
            </div>

            {/* Key Drivers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ai_analysis.key_factors.map((factor: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#0F131C] border border-[#1E2330] text-xs text-gray-300 flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{ai_analysis.disclaimer}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREDICTION MARKETS */}
      {activeTab === 'predictions' && ai_analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ai_analysis.market_predictions.map((m: any, idx: number) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#131720] border border-[#1E2430] p-4 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-400 uppercase tracking-wider">
                  {m.market_name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.confidence === 'HIGH'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {m.confidence} CONFIDENCE
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-base font-extrabold text-white">{m.selection}</span>
                <span className="text-lg font-black text-emerald-400">{m.probability_pct}%</span>
              </div>

              <div className="h-1.5 w-full bg-[#1A1F2C] rounded-full overflow-hidden">
                <div
                  style={{ width: `${m.probability_pct}%` }}
                  className="bg-emerald-500 h-full rounded-full"
                />
              </div>

              <p className="text-[11px] text-gray-400 leading-normal">
                {m.explanation}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MATCH STATISTICS */}
      {activeTab === 'stats' && statistics && (
        <div className="rounded-2xl bg-[#131720] border border-[#1E2430] p-6 space-y-5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
            Live Match Telemetry
          </h3>

          {[
            { label: 'Ball Possession (%)', home: statistics.home_possession, away: statistics.away_possession },
            { label: 'Total Shots', home: statistics.home_shots_total, away: statistics.away_shots_total },
            { label: 'Shots on Target', home: statistics.home_shots_on_target, away: statistics.away_shots_on_target },
            { label: 'Expected Goals (xG)', home: statistics.home_xg, away: statistics.away_xg },
            { label: 'Corner Kicks', home: statistics.home_corners, away: statistics.away_corners },
            { label: 'Fouls Committed', home: statistics.home_fouls, away: statistics.away_fouls },
            { label: 'Yellow Cards', home: statistics.home_yellow_cards, away: statistics.away_yellow_cards },
          ].map((stat, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-200">{stat.home}</span>
                <span className="text-gray-400">{stat.label}</span>
                <span className="text-gray-200">{stat.away}</span>
              </div>
              <div className="h-2 w-full bg-[#1A1F2C] rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(Number(stat.home) / (Number(stat.home) + Number(stat.away) || 1)) * 100}%` }}
                  className="bg-emerald-500 h-full"
                />
                <div
                  style={{ width: `${(Number(stat.away) / (Number(stat.home) + Number(stat.away) || 1)) * 100}%` }}
                  className="bg-cyan-500 h-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: H2H & RECENT ENCOUNTERS */}
      {activeTab === 'h2h' && h2h && (
        <div className="rounded-2xl bg-[#131720] border border-[#1E2430] p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
            Historical Head-to-Head Encounters
          </h3>
          <div className="grid grid-cols-3 text-center p-4 rounded-xl bg-[#0F131C] border border-[#1C212E]">
            <div>
              <div className="text-2xl font-black text-white">{h2h.home_wins}</div>
              <div className="text-xs text-gray-400">{fixture.home_team.name} Wins</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400">{h2h.draws}</div>
              <div className="text-xs text-gray-400">Draws</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{h2h.away_wins}</div>
              <div className="text-xs text-gray-400">{fixture.away_team.name} Wins</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {h2h.recent_matches.map((m: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0F131C] border border-[#1A1E29] text-xs"
              >
                <span className="text-gray-400">{m.date}</span>
                <span className="font-semibold text-white">
                  Score: {m.home_score} - {m.away_score}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
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
