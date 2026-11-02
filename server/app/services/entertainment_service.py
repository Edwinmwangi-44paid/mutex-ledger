import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("pesaflip.entertainment")


class EntertainmentService:
    """
    Dedicated Entertainment & Media Discovery Service (Movies & TV Series).
    Provides discovery, ratings, synopses, cast, trailers, and legal streaming availability.
    Does NOT stream or redistribute pirated media.
    """

    MEDIA_ITEMS: List[Dict[str, Any]] = [
        {
            "id": "proj-hail-mary",
            "title": "Project Hail Mary",
            "type": "movie",
            "year": 2026,
            "rating": 8.2,
            "backdrop": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop",
            "poster": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop",
            "tagline": "Save the sun. Save humanity.",
            "synopsis": "Science teacher Ryland Grace wakes up on a spaceship light years from home with no recollection of who he is or how he got there. As his memory returns, he begins to uncover his mission: solve an extinction-level solar crisis.",
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
            "synopsis": "Jake Sully and Neytiri encounter the Ash People, a fiery and hostile clan of Na'vi residing near volcanic territories that challenges everything they know about Pandora.",
            "genres": ["Action", "Sci-Fi", "Adventure", "Fantasy"],
            "runtime": "3h 10m",
            "director": "James Cameron",
            "cast": ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver", "Oona Chaplin"],
            "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "featured": False,
            "trending": True,
            "popular": True,
            "streaming_providers": [
                {"name": "Disney+", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg", "url": "https://www.disneyplus.com"},
            ],
        },
        {
            "id": "scream-7",
            "title": "Scream 7",
            "type": "movie",
            "year": 2026,
            "rating": 7.3,
            "backdrop": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop",
            "poster": "https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=600&auto=format&fit=crop",
            "tagline": "What's your favorite scary movie now?",
            "synopsis": "Sidney Prescott confronts Ghostface once more in a deadly psychological survival pursuit across a secluded coastal compound.",
            "genres": ["Horror", "Mystery", "Thriller"],
            "runtime": "1h 58m",
            "director": "Kevin Williamson",
            "cast": ["Neve Campbell", "Courteney Cox", "Patrick Dempsey"],
            "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "featured": False,
            "trending": True,
            "popular": True,
            "streaming_providers": [
                {"name": "Paramount+", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg", "url": "https://www.paramountplus.com"},
            ],
        },
        {
            "id": "super-mario-galaxy",
            "title": "The Super Mario Galaxy Movie",
            "type": "movie",
            "year": 2026,
            "rating": 7.9,
            "backdrop": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop",
            "poster": "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop",
            "tagline": "A whole new cosmos to explore.",
            "synopsis": "Mario, Luigi, and Rosalina embark on an interstellar space voyage across cosmic galaxies to stop Bowser's universal reactor from collapsing space-time.",
            "genres": ["Animation", "Comedy", "Adventure", "Family"],
            "runtime": "1h 44m",
            "director": "Aaron Horvath, Michael Jelenic",
            "cast": ["Chris Pratt", "Charlie Day", "Anya Taylor-Joy", "Jack Black"],
            "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "featured": False,
            "trending": True,
            "popular": False,
            "streaming_providers": [
                {"name": "Netflix", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", "url": "https://www.netflix.com"},
                {"name": "Showmax", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/8/87/Showmax_logo.png", "url": "https://www.showmax.com"},
            ],
        },
        {
            "id": "send-help",
            "title": "Send Help",
            "type": "movie",
            "year": 2026,
            "rating": 7.5,
            "backdrop": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
            "poster": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop",
            "tagline": "Two coworkers. One deserted island.",
            "synopsis": "A tense, psychological wilderness survival thriller following an executive and her colleague marooned on an uncharted island.",
            "genres": ["Thriller", "Drama", "Mystery"],
            "runtime": "2h 02m",
            "director": "Sam Raimi",
            "cast": ["Rachel McAdams", "Dylan O'Brien"],
            "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "featured": False,
            "trending": True,
            "popular": True,
            "streaming_providers": [
                {"name": "Hulu", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg", "url": "https://www.hulu.com"},
            ],
        },
        {
            "id": "severance-s2",
            "title": "Severance",
            "type": "series",
            "year": 2025,
            "rating": 8.7,
            "backdrop": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1600&auto=format&fit=crop",
            "poster": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
            "tagline": "Please do not attempt to contact the outside world.",
            "synopsis": "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. In Season 2, the barrier shatters.",
            "genres": ["Sci-Fi", "Mystery", "Psychological Thriller"],
            "seasons_count": 2,
            "episodes_count": 19,
            "director": "Ben Stiller",
            "cast": ["Adam Scott", "Patricia Arquette", "John Turturro", "Christopher Walken"],
            "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "featured": False,
            "trending": True,
            "popular": True,
            "streaming_providers": [
                {"name": "Apple TV+", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_plus_logo.svg", "url": "https://tv.apple.com"},
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
            "synopsis": "Years after their perilous journey across post-pandemic America, Joel and Ellie face violent retribution and unresolved trauma in Seattle.",
            "genres": ["Action", "Adventure", "Drama", "Post-Apocalyptic"],
            "seasons_count": 2,
            "episodes_count": 16,
            "director": "Craig Mazin, Neil Druckmann",
            "cast": ["Pedro Pascal", "Bella Ramsey", "Kaitlyn Dever"],
            "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "featured": False,
            "trending": True,
            "popular": True,
            "streaming_providers": [
                {"name": "Max (HBO)", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Max_logo.svg", "url": "https://www.max.com"},
                {"name": "Showmax", "type": "subscription", "logo": "https://upload.wikimedia.org/wikipedia/commons/8/87/Showmax_logo.png", "url": "https://www.showmax.com"},
            ],
        },
    ]

    @classmethod
    def get_entertainment_hub(cls) -> Dict[str, Any]:
        featured = [m for m in cls.MEDIA_ITEMS if m.get("featured")][0]
        trending = [m for m in cls.MEDIA_ITEMS if m.get("trending")]
        movies = [m for m in cls.MEDIA_ITEMS if m["type"] == "movie"]
        series = [m for m in cls.MEDIA_ITEMS if m["type"] == "series"]
        top_rated = sorted(cls.MEDIA_ITEMS, key=lambda x: x["rating"], reverse=True)

        return {
            "hero_featured": featured,
            "trending_this_week": trending,
            "popular_movies": movies,
            "popular_series": series,
            "top_rated": top_rated,
            "genres": ["All", "Sci-Fi", "Action", "Drama", "Thriller", "Horror", "Comedy", "Adventure"],
            "streaming_partners": ["Netflix", "Disney+", "Apple TV+", "Prime Video", "Max", "Showmax", "Paramount+"],
        }

    @classmethod
    def get_media_details(cls, media_id: str) -> Optional[Dict[str, Any]]:
        for m in cls.MEDIA_ITEMS:
            if m["id"] == media_id:
                # Add similar recommendations
                similar = [
                    item for item in cls.MEDIA_ITEMS
                    if item["id"] != media_id and any(g in item["genres"] for g in m["genres"])
                ]
                return {**m, "similar_titles": similar[:4]}
        return None

    @classmethod
    def search_media(cls, query: str) -> List[Dict[str, Any]]:
        q = query.lower()
        return [
            m for m in cls.MEDIA_ITEMS
            if q in m["title"].lower() or any(q in g.lower() for g in m["genres"]) or q in m.get("director", "").lower()
        ]

