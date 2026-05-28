from functools import lru_cache

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
    openai_api_key: str
    embedding_model: str = "text-embedding-3-small"

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

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_hosts_list(self) -> list[str]:
        return [h.strip() for h in self.allowed_hosts.split(",") if h.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
