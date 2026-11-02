import React, { useState, useEffect } from 'react';
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
  } from 'lucide-react';

interface EntertainmentDiscoveryProps {
  apiBase: string;
}

export const EntertainmentDiscovery: React.FC<EntertainmentDiscoveryProps> = ({ apiBase }) => {
  const [hub, setHub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  useEffect(() => {
    fetchHub();
  }, []);

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
  const trending = hub.trending_this_week || [];
  // popular movies available in hub
const series = hub.popular_series || [];

  return (
    <div className="space-y-10 pb-12">
      {/* Cinematic Hero Spotlight Banner (Inspired by Cinestream) */}
      {hero && (
        <div className="relative rounded-3xl overflow-hidden min-h-[460px] flex items-end p-6 md:p-12 border border-white/10 shadow-2xl">
          {/* Background Image with Cinematic Vignette Overlay */}
          <img
            src={hero.backdrop}
            alt={hero.title}
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F12] via-[#0D0F12]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F12] via-[#0D0F12]/40 to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-md bg-rose-600 font-extrabold text-[11px] text-white uppercase tracking-wider">
                {hero.type}
              </span>
              <span className="text-xs text-gray-300 font-semibold">{hero.year}</span>
              <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{hero.rating}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-none">
              {hero.title}
            </h1>

            <p className="text-xs md:text-sm text-gray-300 line-clamp-3 leading-relaxed">
              {hero.synopsis}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={hero.trailer_url}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-black font-bold text-xs flex items-center gap-2 shadow-xl transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Watch Trailer</span>
              </a>

              <button
                onClick={() => handleOpenDetails(hero.id)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-xs flex items-center gap-2 transition-all"
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
            <h2 className="text-xl md:text-2xl font-black text-white">Trending This Week</h2>
          </div>
          <span className="text-xs text-gray-400 font-medium">All Regional Providers</span>
        </div>

        {/* Horizontal Poster Carousel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trending.map((item: any) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetails(item.id)}
              className="group cursor-pointer space-y-2 relative"
            >
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#161B26] border border-[#232A3B] group-hover:border-rose-500/50 shadow-lg transition-all group-hover:scale-[1.03]">
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:brightness-110 transition-all"
                />
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{item.rating}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-100 group-hover:text-rose-400 transition-colors truncate">
                  {item.title}
                </h4>
                <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
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
      <div className="space-y-4">
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5" />
            <span>Critically Acclaimed</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">Popular Television Series</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {series.map((item: any) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetails(item.id)}
              className="p-4 rounded-2xl bg-[#13161F] hover:bg-[#181D29] border border-[#212736] hover:border-cyan-500/40 transition-all cursor-pointer flex gap-4 items-center group"
            >
              <img
                src={item.poster}
                alt={item.title}
                className="w-20 h-28 rounded-xl object-cover shrink-0"
              />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase">
                    {item.seasons_count} Seasons
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2">{item.synopsis}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MEDIA DETAILS MODAL (STREAMING PROVIDERS & CAST) */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl bg-[#131722] border border-[#232938] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header Backdrop */}
            <div className="relative h-48 sm:h-64 overflow-hidden shrink-0">
              <img
                src={selectedMedia.backdrop || selectedMedia.poster}
                alt={selectedMedia.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-[#131722]/50 to-transparent" />
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <h2 className="text-2xl md:text-3xl font-black text-white">
                  {selectedMedia.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 mt-1">
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
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Storyline
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">{selectedMedia.synopsis}</p>
              </div>

              {/* Cast & Crew */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#0F121A] border border-[#1B202D] text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Director / Creator:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedMedia.director}</div>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Starring Cast:</span>
                  <div className="font-semibold text-white mt-0.5">
                    {selectedMedia.cast?.join(', ')}
                  </div>
                </div>
              </div>

              {/* Authorized Legal Streaming Availability */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
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
                      className="flex items-center justify-between p-3 rounded-xl bg-[#191F2C] hover:bg-[#202738] border border-[#273042] text-xs transition-all group"
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
                          <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {provider.name}
                          </div>
                          <div className="text-[10px] text-gray-400 capitalize">
                            {provider.type}
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
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
    </div>
  );
};
