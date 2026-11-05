from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class LeagueBase(BaseModel):
    id: str
    name: str
    country: str
    sport: Optional[str] = "football"
    logo: Optional[str] = None
    flag: Optional[str] = None
    season: str
    is_popular: bool = False
    order_priority: int = 100
    fixtures_count: Optional[int] = 0

    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    id: str
    name: str
    short_name: Optional[str] = None
    code: Optional[str] = None
    country: Optional[str] = None
    logo: Optional[str] = None
    venue_name: Optional[str] = None

    class Config:
        from_attributes = True


class MatchStatisticSchema(BaseModel):
    home_possession: int = 50
    away_possession: int = 50
    home_shots_total: int = 0
    away_shots_total: int = 0
    home_shots_on_target: int = 0
    away_shots_on_target: int = 0
    home_xg: float = 0.0
    away_xg: float = 0.0
    home_corners: int = 0
    away_corners: int = 0
    home_fouls: int = 0
    away_fouls: int = 0
    home_yellow_cards: int = 0
    away_yellow_cards: int = 0
    home_red_cards: int = 0
    away_red_cards: int = 0

    class Config:
        from_attributes = True


class PredictionItem(BaseModel):
    id: Optional[str] = None
    category: str
    market_name: str
    selection: str
    probability_pct: float
    confidence: str  # "LOW", "MEDIUM", "HIGH"
    explanation: str
    metrics: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class FixtureSummary(BaseModel):
    id: str
    sport: Optional[str] = "football"
    league: LeagueBase
    home_team: TeamBase
    away_team: TeamBase
    kickoff_time: datetime
    status: str
    elapsed_minutes: Optional[int] = None
    home_score: int = 0
    away_score: int = 0
    ht_home_score: Optional[int] = None
    ht_away_score: Optional[int] = None
    venue: Optional[str] = None
    round_name: Optional[str] = None
    is_popular: bool = False
    has_ai_prediction: bool = True
    ai_top_outcome: Optional[str] = None
    ai_top_probability: Optional[float] = None

    class Config:
        from_attributes = True


class H2HSummary(BaseModel):
    total_matches: int
    home_wins: int
    draws: int
    away_wins: int
    home_form: List[str]  # e.g. ["W", "W", "D", "L", "W"]
    away_form: List[str]
    recent_matches: List[Dict[str, Any]]


class AIDeepAnalysisResponse(BaseModel):
    fixture_id: str
    home_team: str
    away_team: str
    kickoff: datetime
    most_likely_outcome: str
    probabilities_1x2: Dict[str, float]
    predicted_score: str
    predicted_goals_range: str
    btts_probability: float
    tactical_summary: str
    key_factors: List[str]
    market_predictions: List[PredictionItem]
    confidence_level: str
    disclaimer: str
    engine_version: str


class LiveTickerItem(BaseModel):
    id: str
    fixture_id: str
    minute: int
    event_type: str  # GOAL, CARD_YELLOW, CARD_RED, VAR, SUB, CHANCE
    team_name: str
    player: str
    score: str
    headline: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class LiveTickerResponse(BaseModel):
    live_matches_count: int
    last_updated: datetime
    ticker_events: List[LiveTickerItem]
    live_fixtures: List[FixtureSummary]


