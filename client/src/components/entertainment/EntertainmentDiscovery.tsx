import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Play,
  Info,
  Star,
  Tv,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  X,
  Sparkles,
  Bot,
  User,
  Send,
  Search,
  Filter,
  Clapperboard,
  Loader2,
} from 'lucide-react';

interface EntertainmentDiscoveryProps {
  apiBase: string;
}

export const EntertainmentDiscovery: React.FC<EntertainmentDiscoveryProps> = ({ apiBase }) => {
  const [hub, setHub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'series'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  // Gemini AI Movie Recommender & Critic Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I'm your Gemini Movie & Series Recommender. Looking for edge-of-your-seat thrillers, sci-fi masterpieces, or bingeable weekend dramas? Tell me your favorite movies, mood, or genres!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHub();
  }, []);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isSendingChat) return;
    const userText = chatInput.trim();
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const historyPayload = chatMessages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch(`${apiBase}/entertainment/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          media_context: selectedMedia ? {
            title: selectedMedia.title,
            year: selectedMedia.year,
            genre: selectedMedia.genre,
          } : null,
          chat_history: historyPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('Local fallback');
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `For ${userText}, I strongly recommend 'Dune: Part Two' for cinematic world-building, 'Shogun' for immersive historical drama, and 'Severance' for gripping psychological mystery!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const fetchHub = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/entertainment/hub`);
      if (res.ok) {
        const data = await res.json();
        setHub(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  // Live Search Effect with Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${apiBase}/entertainment/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch {
        /* ignore */
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, apiBase]);

  const handleOpenDetails = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/entertainment/media/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedMedia(data);
      }
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400">Loading cinematic discovery hub...</p>
      </div>
    );
  }

  if (!hub) return null;

  const hero = hub.hero_featured;
  const rawTrending = hub.trending_this_week || [];
  const rawPopularMovies = hub.popular_movies || [];
  const rawSeries = hub.popular_series || [];

  // Client-side filtering across categories and genres
  const filterMediaList = (list: any[]) => {
    return list.filter((item: any) => {
      // Type filter
      if (selectedType === 'movie' && item.type !== 'movie') return false;
      if (selectedType === 'series' && item.type !== 'series') return false;
      // Genre filter
      if (selectedGenre !== 'All' && !item.genres?.some((g: string) => g.toLowerCase() === selectedGenre.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const trending = filterMediaList(rawTrending);
  const popularMovies = filterMediaList(rawPopularMovies);
  const series = filterMediaList(rawSeries);
  const displayedSearchResults = searchResults ? filterMediaList(searchResults) : null;
  const allGenres = hub.genres || ['All', 'Action', 'Sci-Fi', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Adventure', 'Animation'];

  return (
    <div className="space-y-8 pb-12">
      {/* Live TMDB Search & Category Filter Navigation Bar */}
      <div className="rounded-2xl micro-card p-4 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3.5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Live Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, TV series, actors, or genres in live TMDB catalog..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-rose-500 transition-all"
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-rose-500 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Type Segment Filter: All / Movies / Series */}
          <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl shrink-0">
            {[
              { id: 'all', label: 'All Titles', icon: Clapperboard },
              { id: 'movie', label: 'Movies', icon: Film },
              { id: 'series', label: 'TV Series', icon: Tv },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedType === t.id
                      ? 'bg-rose-600 text-white shadow-sm font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal Genre Pill Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pr-1 shrink-0">
            <Filter className="w-3 h-3" />
            <span>Genre:</span>
          </div>
          {allGenres.map((g: string) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedGenre.toLowerCase() === g.toLowerCase()
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold'
                  : 'bg-black/[0.02] dark:bg-white/[0.03] text-gray-600 dark:text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.05]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH RESULTS VIEW (When query is active) */}
      {searchQuery.trim() ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-950 dark:text-white flex items-center gap-2">
              <span>Search Results for "{searchQuery}"</span>
              {displayedSearchResults && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {displayedSearchResults.length} found
                </span>
              )}
            </h2>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-rose-500 hover:underline"
            >
              Clear Search
            </button>
          </div>

          {displayedSearchResults && displayedSearchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {displayedSearchResults.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetails(item.id)}
                  className="group cursor-pointer space-y-2 relative"
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-black/[0.04] dark:bg-[#161B26] border border-black/[0.08] dark:border-[#232A3B] group-hover:border-rose-500/50 shadow-md transition-all group-hover:scale-[1.03]">
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover object-center group-hover:brightness-105 transition-all"
                    />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{item.rating}</span>
                    </div>
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-mono uppercase font-bold text-white">
                      {item.type}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors truncate">
                      {item.title}
                    </h4>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <span>{item.year}</span>
                      <span>•</span>
                      <span>{item.genres?.[0] || 'Media'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !isSearching ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No titles found matching "{searchQuery}". Try searching for another movie, TV show, or actor.
            </div>
          ) : null}
        </div>
      ) : (
        <>
      {/* Cinematic Hero Spotlight Banner (Inspired by Cinestream) - Micro-1 Polished */}
      {hero && (
        <div className="relative rounded-3xl overflow-hidden min-h-[460px] flex items-end p-6 md:p-12 micro-card border border-black/[0.08] dark:border-white/[0.08] shadow-2xl group">
          {/* Background Image with Cinematic Vignette Overlay */}
          <img
            src={hero.backdrop}
            alt={hero.title}
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.75] dark:brightness-[0.65] contrast-[1.05] group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#080A0E] dark:via-[#080A0E]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 dark:from-[#080A0E] dark:via-[#080A0E]/50 to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 font-extrabold text-[10px] text-white uppercase tracking-wider font-mono shadow-sm">
                {hero.type}
              </span>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold font-mono">{hero.year}</span>
              <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 text-xs font-bold font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                <span>{hero.rating}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-gray-950 dark:text-white tracking-tight uppercase leading-none">
              {hero.title}
            </h1>

            <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
              {hero.synopsis}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={hero.trailer_url}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 rounded-xl bg-gray-950 dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black font-bold text-xs flex items-center gap-2 shadow-xl transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-white dark:fill-black" />
                <span>Watch Trailer</span>
              </a>

              <button
                onClick={() => handleOpenDetails(hero.id)}
                className="px-5 py-2.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/20 backdrop-blur-md text-gray-900 dark:text-white font-semibold text-xs flex items-center gap-2 transition-all border border-black/10 dark:border-white/10"
              >
                <Info className="w-4 h-4" />
                <span>More Info</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trending This Week Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trending</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-950 dark:text-white">Trending This Week</h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">All Regional Providers</span>
        </div>

        {/* Horizontal Poster Carousel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trending.map((item: any) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetails(item.id)}
              className="group cursor-pointer space-y-2 relative"
            >
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-black/[0.04] dark:bg-[#161B26] border border-black/[0.08] dark:border-[#232A3B] group-hover:border-rose-500/50 shadow-md transition-all group-hover:scale-[1.03]">
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:brightness-105 transition-all"
                />
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{item.rating}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors truncate">
                  {item.title}
                </h4>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <span>{item.year}</span>
                  <span>•</span>
                  <span>{item.genres[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Television Series & Shows */}
      {series.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5" />
              <span>Critically Acclaimed</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-950 dark:text-white">Popular Television Series</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {series.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleOpenDetails(item.id)}
                className="p-4 rounded-2xl micro-card border border-black/[0.08] dark:border-[#212736] hover:border-cyan-500/40 transition-all cursor-pointer flex gap-4 items-center group shadow-sm"
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-20 h-28 rounded-xl object-cover shrink-0 shadow-sm"
                />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                      {item.seasons_count} Seasons
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 dark:text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-amber-500 dark:fill-amber-400" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-gray-950 dark:text-white group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{item.synopsis}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Rated & Popular Movies Grid */}
      {popularMovies.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" />
              <span>Must Watch</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-950 dark:text-white">Top Rated Movies</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularMovies.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleOpenDetails(item.id)}
                className="group cursor-pointer space-y-2 relative"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-black/[0.04] dark:bg-[#161B26] border border-black/[0.08] dark:border-[#232A3B] group-hover:border-rose-500/50 shadow-md transition-all group-hover:scale-[1.03]">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:brightness-105 transition-all"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors truncate">
                    {item.title}
                  </h4>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <span>{item.year}</span>
                    <span>•</span>
                    <span>{item.genres?.[0] || 'Movie'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}

      {/* MEDIA DETAILS MODAL (STREAMING PROVIDERS & CAST) */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl micro-card bg-white dark:bg-[#131722] border border-black/[0.1] dark:border-[#232938] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header Backdrop */}
            <div className="relative h-48 sm:h-64 overflow-hidden shrink-0">
              <img
                src={selectedMedia.backdrop || selectedMedia.poster}
                alt={selectedMedia.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#131722] via-white/50 dark:via-[#131722]/50 to-transparent" />
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <h2 className="text-2xl md:text-3xl font-black text-gray-950 dark:text-white">
                  {selectedMedia.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 dark:text-gray-300 mt-1">
                  <span>{selectedMedia.year}</span>
                  <span>•</span>
                  <span>{selectedMedia.runtime || `${selectedMedia.seasons_count} Seasons`}</span>
                  <span>•</span>
                  <span>{selectedMedia.genres.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Synopsis */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Storyline
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedMedia.synopsis}</p>
              </div>

              {/* Cast & Crew */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-black/[0.03] dark:bg-[#0F121A] border border-black/[0.08] dark:border-[#1B202D] text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Director / Creator:</span>
                  <div className="font-semibold text-gray-950 dark:text-white mt-0.5">{selectedMedia.director}</div>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Starring Cast:</span>
                  <div className="font-semibold text-gray-950 dark:text-white mt-0.5">
                    {selectedMedia.cast?.join(', ')}
                  </div>
                </div>
              </div>

              {/* Authorized Legal Streaming Availability */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" />
                  <span>Authorized Streaming Availability</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMedia.streaming_providers?.map((provider: any, idx: number) => (
                    <a
                      key={idx}
                      href={provider.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-black/[0.03] dark:bg-[#191F2C] hover:bg-black/[0.06] dark:hover:bg-[#202738] border border-black/[0.08] dark:border-[#273042] text-xs transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {provider.logo ? (
                          <img
                            src={provider.logo}
                            alt={provider.name}
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
                          <Film className="w-4 h-4 text-gray-400" />
                        )}
                        <div>
                          <div className="font-bold text-gray-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {provider.name}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
                            {provider.type}
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                    </a>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 italic">
                  PesaFlip connects you directly to official streaming platforms. We do not host or pirate video content.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Floating Bottom Right AI Entertainment & Movie Recommender Chatbot */}
      {isChatOpen ? (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-[95vw] sm:w-[400px] h-[520px] bg-white dark:bg-[#0A0C13] border border-black/[0.1] dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col font-sans transition-all duration-300">
            {/* Header */}
            <div className="px-4 py-3 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">AI Movie Recommender</h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                      GEMINI
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono">Personalized titles, streaming &amp; reviews</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.05] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Area */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      msg.sender === 'user'
                        ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-black'
                        : 'bg-gradient-to-tr from-rose-500 to-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-rose-500 text-white rounded-tr-none'
                        : 'bg-black/[0.04] dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 border border-black/[0.06] dark:border-white/[0.06] rounded-tl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="block text-[9px] text-gray-400 mt-1 text-right font-mono">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              {isSendingChat && (
                <div className="flex items-center gap-2.5 pl-1 animate-fade-in">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-gray-600 dark:text-gray-300 text-xs flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] font-mono text-gray-500 ml-1">Curating picks with Gemini AI...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
              {['Sci-Fi Mind-benders', 'Top Thrillers 2025', 'Bingeable Dramas', 'Award Winners'].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInput(s)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/[0.03] dark:bg-white/[0.05] hover:bg-rose-500/10 hover:text-rose-500 text-gray-600 dark:text-gray-400 border border-black/[0.06] dark:border-white/[0.06] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center gap-2 bg-black/[0.02] dark:bg-white/[0.02]">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask for recommendations, moods, or genres..."
                className="flex-1 bg-white dark:bg-[#151922] border border-black/[0.1] dark:border-[#232936] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || isSendingChat}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 hover:shadow-lg hover:scale-105 text-white text-xs font-bold shadow-xl transition-all cursor-pointer border border-white/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask AI Movie Recommender</span>
        </button>
      )}
    </div>
  );
};
