import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PesaFlip Core"
    API_V1_STR: str = "/api/v1"
    
    # PostgreSQL Configuration
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "pesaflip")
    
    # Database connection URL (can be overridden via DATABASE_URL)
    DATABASE_URL: str | None = None
    
    # Redis Configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str | None = os.getenv("REDIS_PASSWORD", None)
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_URL: str | None = None
    
    # Connection Pool Optimizations
    DB_POOL_SIZE: int = 50
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    
    # Idempotency lease duration in seconds
    IDEMPOTENCY_LEASE_SECONDS: int = 300  # 5 minutes
    
    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET") or "PESAFLIP_SUPER_SECRET_CRYPTOGRAPHIC_KEY_2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 1

    # Allowed CORS Origins (comma-separated string or parsed list)
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:8000,https://pesaflip254.onrender.com,https://mutex-ledger.onrender.com"
    )

    # Fallback to in-memory mocks if Postgres/Redis cannot connect
    FALLBACK_IN_MEMORY: bool = True
    
    # Sports Data API Integration (SportAPI.ai key)
    FOOTBALL_API_KEY: str | None = os.getenv("FOOTBALL_API_KEY", None)
    FOOTBALL_API_PROVIDER: str = os.getenv("FOOTBALL_API_PROVIDER", "sportapi")

    # Finnhub Market Data API Integration
    FINNHUB_API_KEY: str = os.getenv("FINNHUB_API_KEY", "dbpjv1hr01qr0r9nu7dgdbpjv1hr01qr0r9nu7e0")

    # FXRatesAPI Real-Time Institutional Forex & Commodities Integration
    FXRATES_API_KEY: str | None = os.getenv("FXRATES_API_KEY", None)

    # TMDB (The Movie Database) Integration
    TMDB_API_KEY: str = os.getenv("TMDB_API_KEY", "0a85f8dd4a9156a2d4b8a650bd850d1d")

    # Gemini AI Integration (read strictly from environment)
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

    # Supabase Integration (read strictly from environment to adhere to push protection)
    SUPABASE_URL: str | None = os.getenv("SUPABASE_URL", None)
    SUPABASE_PUBLISHABLE_KEY: str | None = os.getenv("SUPABASE_PUBLISHABLE_KEY", None)
    SUPABASE_SECRET_KEY: str | None = os.getenv("SUPABASE_SECRET_KEY", None)
    SUPABASE_DB_PASSWORD: str | None = os.getenv("SUPABASE_DB_PASSWORD", None)

    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        
        # If Supabase credentials are provided, construct Supabase PostgreSQL pooler URL
        if self.SUPABASE_URL and self.SUPABASE_DB_PASSWORD:
            import urllib.parse
            import re
            
            # Extract project ref from URL (e.g. https://xfeasbskpnoohtypnpls.supabase.co -> xfeasbskpnoohtypnpls)
            match = re.search(r"https?://([^.]+)\.supabase\.co", self.SUPABASE_URL)
            project_ref = match.group(1) if match else "xfeasbskpnoohtypnpls"
            encoded_password = urllib.parse.quote_plus(self.SUPABASE_DB_PASSWORD)
            
            # Check if custom pooler host is provided, otherwise default to eu-central-1 pooler
            pooler_host = os.getenv("SUPABASE_POOLER_HOST", "aws-0-eu-central-1.pooler.supabase.com")
            pooler_port = os.getenv("SUPABASE_POOLER_PORT", "6543")
            
            return f"postgresql+asyncpg://postgres.{project_ref}:{encoded_password}@{pooler_host}:{pooler_port}/postgres"

        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    def get_redis_url(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
