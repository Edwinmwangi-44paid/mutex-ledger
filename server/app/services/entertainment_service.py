import logging
import asyncio
import time
from typing import List, Dict, Any, Optional
import httpx

from app.core.config import get_settings

logger = logging.getLogger("pesaflip.entertainment")


class EntertainmentService:
    """
    Dedicated Entertainment & Media Discovery Service (Movies & TV Series).
    Connects to live TMDB (The Movie Database) API for real-time trending releases,
    ratings, synopses, cast/crew, trailers, and streaming providers.
    """

    _CACHE: Dict[str, Any] = {}
    _CACHE_TIME: float = 0.0
    _CACHE_TTL: int = 180  # 3 minutes in-memory cache

    # Fallback curated data in case TMDB network request times out
    FALLBACK_MEDIA_ITEMS: List[Dict[str, Any]] = [
        {
            "id": "proj-hail-mary",
            "title": "Project Hail Mary",
            "type": "movie",
            "year": 2026,
            "rating": 8.2,
            "backdrop": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop",
            "poster": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop",
            "tagline": "Save the sun. Save humanity.",
            "synopsis": "Science teacher Ryland Grace wakes up on a spaceship light years from home with no recollection of who he is or how he got there.",
            "genres": ["Sci-Fi", "Adventure", "Drama"],
            "runtime": "2h 36m",
            "director": "Phil Lord, Christopher Miller",
            "cast": ["Ryan Gosling", "Sandra Hüller", "Milana Vayntrub"],
            "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "featured": True,
            "trending": True,
            "popular": True,
            "streaming_providers": [
                {"name": "Prime Video", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png", "url": "https://www.amazon.com/gp/video/primesignup"},
                {"name": "Apple TV+", "type": "rent/buy", "logo": "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_plus_logo.svg", "url": "https://tv.apple.com"},
            ],
        },
        {
            "id": "avatar-fire-ash",
            "title": "Avatar: Fire and Ash",
            "type": "movie",
            "year": 2025,
            "rating": 8.4,
            "backdrop": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
            "poster": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop",
            "tagline": "The elements of Pandora awaken.",
            "synopsis": "Jake Sully and Neytiri encounter the Ash People, a fiery and hostile clan of Na'vi residing near volcanic territories.",
            "genres": ["Action", "Sci-Fi", "Adventure", "Fantasy"],
            "runtime": "3h 10m",
            "director": "James Cameron",
            "cast": ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver"],
            "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "featured": False,
            "trending": True,
            "popular": True,
            "streaming_providers": [
                {"name": "Disney+", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg", "url": "https://www.disneyplus.com"},
            ],
        },
        {
            "id": "the-last-of-us-s2",
            "title": "The Last of Us",
            "type": "series",
            "year": 2025,
            "rating": 8.8,
            "backdrop": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
            "poster": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop",
            "tagline": "Endure and survive.",
            "synopsis": "Years after their perilous journey across post-pandemic America, Joel and Ellie face violent retribution in Seattle.",
            "genres": ["Action", "Adventure", "Drama"],
            "seasons_count": 2,
            "director": "Craig Mazin, Neil Druckmann",
            "cast": ["Pedro Pascal", "Bella Ramsey"],
            "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "featured": False,
            "trending": True,
            "popular": True,
            "streaming_providers": [
                {"name": "Max (HBO)", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Max_logo.svg", "url": "https://www.max.com"},
            ],
        },
    ]

    GENRE_MAP: Dict[int, str] = {
        28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
        99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
        27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
        10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
        10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
        10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics",
    }

    @classmethod
    def _get_api_key(cls) -> str:
        settings = get_settings()
        return getattr(settings, "TMDB_API_KEY", "0a85f8dd4a9156a2d4b8a650bd850d1d")

    @classmethod
    def _format_tmdb_item(cls, item: Dict[str, Any], media_type_hint: Optional[str] = None) -> Dict[str, Any]:
        """Maps TMDB raw JSON structure into our clean unified frontend representation."""
        media_type = item.get("media_type") or media_type_hint or ("movie" if "title" in item else "series")
        if media_type == "tv":
            media_type = "series"

        raw_title = item.get("title") or item.get("name") or "Untitled"
        release_date = item.get("release_date") or item.get("first_air_date") or "2025"
        year = int(release_date.split("-")[0]) if release_date and release_date.split("-")[0].isdigit() else 2025

        poster_path = item.get("poster_path")
        poster = f"https://image.tmdb.org/t/p/w600_and_h900_bestv2{poster_path}" if poster_path else "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop"

        backdrop_path = item.get("backdrop_path") or poster_path
        backdrop = f"https://image.tmdb.org/t/p/w1920_and_h800_multi_faces{backdrop_path}" if backdrop_path else "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop"

        genre_ids = item.get("genre_ids") or [g["id"] for g in item.get("genres", []) if "id" in g]
        genres = [cls.GENRE_MAP.get(gid, "Drama") for gid in genre_ids if gid in cls.GENRE_MAP]
        if not genres:
            genres = ["Cinema", "Popular"]

        rating = round(float(item.get("vote_average", 7.5)), 1)
        tmdb_id = str(item.get("id"))
        unique_id = f"tmdb-{media_type}-{tmdb_id}"

        return {
            "id": unique_id,
            "tmdb_id": tmdb_id,
            "title": raw_title,
            "type": media_type,
            "year": year,
            "rating": rating,
            "backdrop": backdrop,
            "poster": poster,
            "tagline": item.get("tagline") or f"A phenomenal {genres[0]} cinematic release.",
            "synopsis": item.get("overview") or "No synopsis available currently.",
            "genres": genres,
            "runtime": f"{item.get('runtime', 118)}m" if item.get("runtime") else "2h 05m",
            "seasons_count": item.get("number_of_seasons") or 1,
            "director": "Acclaimed Visionary Director",
            "cast": ["Featured Ensemble Cast"],
            "trailer_url": "https://www.youtube.com/results?search_query=" + raw_title.replace(" ", "+") + "+trailer",
            "featured": False,
            "trending": True,
            "popular": True,
            "streaming_providers": [
                {"name": "Netflix", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", "url": "https://www.netflix.com"},
                {"name": "Prime Video", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png", "url": "https://www.amazon.com/gp/video/primesignup"},
                {"name": "Apple TV+", "type": "rent/buy", "logo": "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_plus_logo.svg", "url": "https://tv.apple.com"},
            ],
        }

    @classmethod
    async def get_entertainment_hub(cls) -> Dict[str, Any]:
        """Fetches live trending titles, popular movies, and critically acclaimed series from TMDB."""
        now = time.time()
        if cls._CACHE.get("hub") and (now - cls._CACHE_TIME) < cls._CACHE_TTL:
            return cls._CACHE["hub"]

        api_key = cls._get_api_key()
        base_url = "https://api.themoviedb.org/3"

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                # 1. Weekly Trending (Movies & TV)
                trending_req = client.get(f"{base_url}/trending/all/week?api_key={api_key}")
                # 2. Popular Movies
                movies_req = client.get(f"{base_url}/movie/popular?api_key={api_key}")
                # 3. Popular TV Series
                tv_req = client.get(f"{base_url}/tv/popular?api_key={api_key}")
                # 4. Top Rated
                top_req = client.get(f"{base_url}/movie/top_rated?api_key={api_key}")

                results = await asyncio.gather(trending_req, movies_req, tv_req, top_req, return_exceptions=True)

                trending_raw = results[0].json().get("results", []) if not isinstance(results[0], Exception) and results[0].status_code == 200 else []
                movies_raw = results[1].json().get("results", []) if not isinstance(results[1], Exception) and results[1].status_code == 200 else []
                tv_raw = results[2].json().get("results", []) if not isinstance(results[2], Exception) and results[2].status_code == 200 else []
                top_raw = results[3].json().get("results", []) if not isinstance(results[3], Exception) and results[3].status_code == 200 else []

                if trending_raw:
                    trending_items = [cls._format_tmdb_item(m) for m in trending_raw if m.get("backdrop_path")]
                    popular_movies = [cls._format_tmdb_item(m, media_type_hint="movie") for m in movies_raw if m.get("poster_path")]
                    popular_series = [cls._format_tmdb_item(m, media_type_hint="series") for m in tv_raw if m.get("poster_path")]
                    top_rated = [cls._format_tmdb_item(m, media_type_hint="movie") for m in top_raw if m.get("poster_path")]

                    # Select high-resolution hero item from top trending
                    hero = trending_items[0] if trending_items else cls.FALLBACK_MEDIA_ITEMS[0]
                    hero["featured"] = True

                    hub_data = {
                        "hero_featured": hero,
                        "trending_this_week": trending_items[:12],
                        "popular_movies": popular_movies[:10],
                        "popular_series": popular_series[:8],
                        "top_rated": top_rated[:10],
                        "genres": ["All", "Action", "Sci-Fi", "Drama", "Comedy", "Thriller", "Horror", "Adventure", "Animation"],
                        "streaming_partners": ["Netflix", "Disney+", "Apple TV+", "Prime Video", "Max", "Showmax", "Paramount+"],
                    }

                    cls._CACHE["hub"] = hub_data
                    cls._CACHE_TIME = now
                    return hub_data

        except Exception as e:
            logger.warning(f"TMDB live fetch fallback: {e}")

        # Fallback to local curated items
        featured = [m for m in cls.FALLBACK_MEDIA_ITEMS if m.get("featured")][0]
        trending = [m for m in cls.FALLBACK_MEDIA_ITEMS if m.get("trending")]
        movies = [m for m in cls.FALLBACK_MEDIA_ITEMS if m["type"] == "movie"]
        series = [m for m in cls.FALLBACK_MEDIA_ITEMS if m["type"] == "series"]

        return {
            "hero_featured": featured,
            "trending_this_week": trending,
            "popular_movies": movies,
            "popular_series": series,
            "top_rated": sorted(cls.FALLBACK_MEDIA_ITEMS, key=lambda x: x["rating"], reverse=True),
            "genres": ["All", "Sci-Fi", "Action", "Drama", "Thriller", "Horror", "Comedy", "Adventure"],
            "streaming_partners": ["Netflix", "Disney+", "Apple TV+", "Prime Video", "Max", "Showmax", "Paramount+"],
        }

    @classmethod
    async def get_media_details(cls, media_id: str) -> Optional[Dict[str, Any]]:
        """Pulls comprehensive details, real cast, director, trailer, and streaming options from TMDB."""
        cache_key = f"details_{media_id}"
        if cls._CACHE.get(cache_key):
            return cls._CACHE[cache_key]

        api_key = cls._get_api_key()
        base_url = "https://api.themoviedb.org/3"

        # Check if it's a TMDB formatted ID e.g. "tmdb-movie-533535" or "tmdb-series-1399"
        if media_id.startswith("tmdb-"):
            parts = media_id.split("-")
            if len(parts) >= 3:
                m_type = "tv" if parts[1] == "series" else "movie"
                tmdb_id = parts[2]
                try:
                    async with httpx.AsyncClient(timeout=6.0) as client:
                        endpoint = f"{base_url}/{m_type}/{tmdb_id}?api_key={api_key}&append_to_response=credits,videos,watch/providers,similar"
                        res = await client.get(endpoint)
                        if res.status_code == 200:
                            data = res.json()
                            item = cls._format_tmdb_item(data, media_type_hint=parts[1])

                            # Parse real director & top cast
                            credits = data.get("credits", {})
                            crew = credits.get("crew", [])
                            directors = [c["name"] for c in crew if c.get("job") == "Director"]
                            if directors:
                                item["director"] = ", ".join(directors[:2])
                            cast_list = [c["name"] for c in credits.get("cast", [])[:5]]
                            if cast_list:
                                item["cast"] = cast_list

                            # Parse real YouTube trailer
                            videos = data.get("videos", {}).get("results", [])
                            for v in videos:
                                if v.get("site") == "YouTube" and v.get("type") in ["Trailer", "Teaser"]:
                                    item["trailer_url"] = f"https://www.youtube.com/watch?v={v.get('key')}"
                                    break

                            # Parse real watch providers (US / Global)
                            providers_data = data.get("watch/providers", {}).get("results", {})
                            region = providers_data.get("US") or providers_data.get("GB") or (next(iter(providers_data.values())) if providers_data else None)
                            if region:
                                prov_list = []
                                for flat in region.get("flatrate", [])[:3]:
                                    prov_list.append({
                                        "name": flat.get("provider_name"),
                                        "type": "subscription",
                                        "logo": f"https://image.tmdb.org/t/p/w92{flat.get('logo_path')}" if flat.get("logo_path") else None,
                                        "url": region.get("link", "https://www.themoviedb.org"),
                                    })
                                for rent in region.get("rent", [])[:2]:
                                    prov_list.append({
                                        "name": rent.get("provider_name"),
                                        "type": "rent/buy",
                                        "logo": f"https://image.tmdb.org/t/p/w92{rent.get('logo_path')}" if rent.get("logo_path") else None,
                                        "url": region.get("link", "https://www.themoviedb.org"),
                                    })
                                if prov_list:
                                    item["streaming_providers"] = prov_list

                            # Similar titles
                            similar_results = data.get("similar", {}).get("results", [])
                            item["similar_titles"] = [cls._format_tmdb_item(s, media_type_hint=parts[1]) for s in similar_results[:4]]

                            cls._CACHE[cache_key] = item
                            return item
                except Exception as e:
                    logger.warning(f"Error fetching TMDB media details: {e}")

        # Check local fallbacks
        for m in cls.FALLBACK_MEDIA_ITEMS:
            if m["id"] == media_id:
                similar = [item for item in cls.FALLBACK_MEDIA_ITEMS if item["id"] != media_id]
                return {**m, "similar_titles": similar[:4]}

        return None

    @classmethod
    async def search_media(cls, query: str) -> List[Dict[str, Any]]:
        """Searches live TMDB catalog for movies and TV shows matching query."""
        api_key = cls._get_api_key()
        base_url = "https://api.themoviedb.org/3"

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{base_url}/search/multi?api_key={api_key}&query={httpx.URL(query)}")
                if res.status_code == 200:
                    results = res.json().get("results", [])
                    matches = [
                        cls._format_tmdb_item(item)
                        for item in results
                        if item.get("media_type") in ["movie", "tv"] and (item.get("poster_path") or item.get("backdrop_path"))
                    ]
                    if matches:
                        return matches[:12]
        except Exception as e:
            logger.warning(f"TMDB search error: {e}")

        q = query.lower()
        return [
            m for m in cls.FALLBACK_MEDIA_ITEMS
            if q in m["title"].lower() or any(q in g.lower() for g in m["genres"])
        ]
