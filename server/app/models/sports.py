import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.ledger import Base


class League(Base):
    __tablename__ = "leagues"

    id = Column(String(64), primary_key=True)
    external_id = Column(Integer, nullable=True, index=True)
    name = Column(String(128), nullable=False, index=True)
    country = Column(String(64), nullable=False, index=True)
    logo = Column(String(512), nullable=True)
    flag = Column(String(512), nullable=True)
    season = Column(String(32), default="2025/2026")
    is_popular = Column(Boolean, default=False, index=True)
    order_priority = Column(Integer, default=100)

    fixtures = relationship("Fixture", back_populates="league", cascade="all, delete-orphan")


class Team(Base):
    __tablename__ = "teams"

    id = Column(String(64), primary_key=True)
    external_id = Column(Integer, nullable=True, index=True)
    name = Column(String(128), nullable=False, index=True)
    short_name = Column(String(32), nullable=True)
    code = Column(String(10), nullable=True)
    country = Column(String(64), nullable=True)
    logo = Column(String(512), nullable=True)
    venue_name = Column(String(128), nullable=True)

    home_fixtures = relationship("Fixture", foreign_keys="Fixture.home_team_id", back_populates="home_team")
    away_fixtures = relationship("Fixture", foreign_keys="Fixture.away_team_id", back_populates="away_team")


class Fixture(Base):
    __tablename__ = "fixtures"

    id = Column(String(64), primary_key=True)
    external_id = Column(Integer, nullable=True, index=True)
    league_id = Column(String(64), ForeignKey("leagues.id"), nullable=False, index=True)
    home_team_id = Column(String(64), ForeignKey("teams.id"), nullable=False, index=True)
    away_team_id = Column(String(64), ForeignKey("teams.id"), nullable=False, index=True)

    kickoff_time = Column(DateTime, nullable=False, index=True)
    status = Column(String(32), default="SCHEDULED", index=True)  # SCHEDULED, LIVE, HT, FT, POSTPONED
    elapsed_minutes = Column(Integer, nullable=True)
    
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    ht_home_score = Column(Integer, nullable=True)
    ht_away_score = Column(Integer, nullable=True)

    venue = Column(String(128), nullable=True)
    round_name = Column(String(64), nullable=True)
    is_popular = Column(Boolean, default=False, index=True)
    has_ai_prediction = Column(Boolean, default=True)

    league = relationship("League", back_populates="fixtures")
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_fixtures")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_fixtures")
    statistics = relationship("MatchStatistic", uselist=False, back_populates="fixture", cascade="all, delete-orphan")
    predictions = relationship("MatchPrediction", back_populates="fixture", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_fixtures_status_kickoff", "status", "kickoff_time"),
    )


class MatchStatistic(Base):
    __tablename__ = "match_statistics"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    fixture_id = Column(String(64), ForeignKey("fixtures.id"), unique=True, nullable=False)

    home_possession = Column(Integer, default=50)
    away_possession = Column(Integer, default=50)

    home_shots_total = Column(Integer, default=0)
    away_shots_total = Column(Integer, default=0)
    home_shots_on_target = Column(Integer, default=0)
    away_shots_on_target = Column(Integer, default=0)

    home_xg = Column(Float, default=0.0)
    away_xg = Column(Float, default=0.0)

    home_corners = Column(Integer, default=0)
    away_corners = Column(Integer, default=0)

    home_fouls = Column(Integer, default=0)
    away_fouls = Column(Integer, default=0)

    home_yellow_cards = Column(Integer, default=0)
    away_yellow_cards = Column(Integer, default=0)
    home_red_cards = Column(Integer, default=0)
    away_red_cards = Column(Integer, default=0)

    fixture = relationship("Fixture", back_populates="statistics")


class MatchPrediction(Base):
    __tablename__ = "match_predictions"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    fixture_id = Column(String(64), ForeignKey("fixtures.id"), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)  # MATCH_RESULT, DOUBLE_CHANCE, GOALS, BTTS, HALF_TIME, TEAM_PERF, OTHER
    market_name = Column(String(64), nullable=False)  # "1X2", "Over/Under 2.5", "BTTS", etc.
    selection = Column(String(64), nullable=False)    # "Home Win", "Over 2.5", "Yes"
    probability_pct = Column(Float, nullable=False)   # 0 to 100
    confidence = Column(String(16), nullable=False)   # LOW, MEDIUM, HIGH
    explanation = Column(Text, nullable=False)
    metrics_json = Column(JSON, nullable=True)        # supporting stats dictionary
    engine_version = Column(String(32), default="v1.4-poisson-hybrid")
    created_at = Column(DateTime, default=datetime.utcnow)

    fixture = relationship("Fixture", back_populates="predictions")


class UserFavorite(Base):
    __tablename__ = "user_favorites"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(64), nullable=False, index=True)
    item_type = Column(String(32), nullable=False)  # "fixture", "team", "league"
    item_id = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

