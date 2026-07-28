from typing import List, Literal, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "OneWishlist API"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    # ── Database (Neon PostgreSQL) ──────────────────────────────────────────
    #DATABASE_URL: str = "postgresql+psycopg2://user:password@localhost:5432/onewishlist"
    DATABASE_URL: str = "postgresql://neondb_owner:npg_u6VdniF4QswN@ep-plain-waterfall-az6t32wk.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

    # ── JWT Authentication ──────────────────────────────────────────────────
    JWT_SECRET: str = "change_me_to_a_random_32_char_secret_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Cookie Settings ─────────────────────────────────────────────────────
    COOKIE_SECURE: bool = False           # True in production (HTTPS only)
    COOKIE_SAMESITE: str = "lax"         # "strict" | "lax" | "none"
    COOKIE_DOMAIN: Union[str, None] = None

    # ── Resend Transactional Emails ─────────────────────────────────────────
    RESEND_API_KEY: str = "sandbox"          # Set to your real key in .env
    FROM_EMAIL: str = "onboarding@resend.dev"
    FROM_EMAIL_NAME: str = "OneWishlist"

    # ── Frontend / CORS ─────────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
