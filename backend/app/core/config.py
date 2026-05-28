from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    app_env: str = "development"
    app_debug: bool = True
    app_secret_key: str = "change-me"

    database_url: str
    redis_url: str = "redis://localhost:6379/0"

    anthropic_api_key: str
    anthropic_model: str = "claude-sonnet-4-6"
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"

    # Voyage AI — preferred embedding provider (multilingual, free tier, 1024-dim)
    voyage_api_key: str = ""
    voyage_model: str = "voyage-3.5-lite"

    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    clerk_jwt_issuer: str = ""
    clerk_jwks_url: str = ""
    clerk_webhook_secret: str = ""

    cors_origins: str = "http://localhost:3000"
    allowed_hosts: str = "localhost,127.0.0.1"

    sentry_dsn: str = ""
    rate_limit_per_minute: int = 60
    widget_rate_limit_per_minute: int = 20

    max_upload_mb: int = 25

    # When Clerk isn't configured (no JWKS URL) in a non-production env, accept a
    # synthetic dev user so the frontend/dashboard can be built before signing up
    # for Clerk. NEVER active in production.
    @property
    def clerk_configured(self) -> bool:
        return bool(self.clerk_jwks_url or self.clerk_jwt_issuer)

    @property
    def dev_auth_bypass(self) -> bool:
        return self.app_env != "production" and not self.clerk_configured

    @model_validator(mode="after")
    def _backfill_empty_keys_from_dotenv(self) -> "Settings":
        """Some environments inject AI-key env vars as empty strings, which would
        otherwise shadow the .env file (env vars outrank .env in pydantic-settings).
        Backfill only the *empty* secret fields from .env so a real .env value wins
        over an empty injected env var. Non-empty env vars still take precedence,
        and in production (no .env file) this is a no-op."""
        empties = [f for f in ("anthropic_api_key", "openai_api_key", "voyage_api_key")
                   if not getattr(self, f)]
        if empties:
            from dotenv import dotenv_values

            vals = dotenv_values(self.model_config.get("env_file", ".env"))
            for field in empties:
                v = vals.get(field.upper())
                if v:
                    setattr(self, field, v)
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_hosts_list(self) -> list[str]:
        return [h.strip() for h in self.allowed_hosts.split(",") if h.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
