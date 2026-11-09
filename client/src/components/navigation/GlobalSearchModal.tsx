import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Trophy,
  LineChart,
  Film,
  Sparkles,
  ArrowRight,
  } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  apiBase,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/discovery/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, apiBase]);

  if (!isOpen) return null;

  const handleSelect = (route: string) => {
    navigate(route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#12151B] border border-[#232834] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1E232E] gap-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams (Arsenal), crypto (Bitcoin, SOL), movies (Project Hail Mary)..."
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#1E232E] text-gray-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="text-center py-8 text-xs text-gray-400 animate-pulse">
              Searching across Sports, Crypto, and Entertainment...
            </div>
          )}

          {!loading && !query && (
            <div className="py-6 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-medium text-gray-300">Unified Cross-Domain Intelligence</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Type any club name, coin symbol, or entertainment title to instantly explore real-time stats, AI projections, and streaming links.
              </p>
            </div>
          )}

          {!loading && results && (
            <div className="space-y-4">
              {results.ai_synopsis && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">AI Quick Insight: </span>
                    {results.ai_synopsis}
                  </div>
                </div>
              )}

              {/* Sports Results */}
              {results.results?.sports?.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sports &amp; Clubs</span>
                  </div>
                  <div className="space-y-1">
                    {results.results.sports.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item.route)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#1A1F29] cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-8 h-8 rounded-full object-contain bg-white/5 p-1"
                          />
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-400">{item.subtitle}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TradingView Results */}
              {results.results?.crypto?.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <LineChart className="w-3.5 h-3.5 text-cyan-400" />
                    <span>TradingView Intelligence</span>
                  </div>
                  <div className="space-y-1">
                    {results.results.crypto.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item.route)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#1A1F29] cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-400">{item.subtitle}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Entertainment Results */}
              {results.results?.entertainment?.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-rose-400" />
                    <span>Entertainment &amp; Media</span>
                  </div>
                  <div className="space-y-1">
                    {results.results.entertainment.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item.route)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#1A1F29] cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-8 h-10 rounded-md object-cover"
                          />
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-rose-400 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-400">{item.subtitle}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.total_results === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">
                  No matching items found for "{query}".
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
