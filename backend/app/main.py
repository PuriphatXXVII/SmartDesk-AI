import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from secweb.contentSecurityPolicy import ContentSecurityPolicy
from secweb.referrerPolicy import ReferrerPolicy
from secweb.strictTransportSecurity import HSTS
from secweb.xContentTypeOptions import XContentTypeOptions
from secweb.xFrameOptions import XFrameOptions
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import auth, chat, health, knowledge
from app.core.config import get_settings
from app.core.security import limiter

settings = get_settings()

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=0.1,
        send_default_pii=False,  # never ship PII to Sentry
    )

app = FastAPI(
    title="SmartDesk AI API",
    description="RAG-powered customer support backend",
    version="0.1.0",
    docs_url="/docs" if settings.app_debug else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.app_debug else None,
)

# -----------------------------------------------------------------------------
# Security middleware stack (order matters — applied bottom-up)
# -----------------------------------------------------------------------------
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts_list,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Widget-Key"],
    max_age=600,
)

# OWASP-recommended security headers
app.add_middleware(XContentTypeOptions)
app.add_middleware(XFrameOptions, Option={"X-Frame-Options": "DENY"})
app.add_middleware(ReferrerPolicy, Option={"Referrer-Policy": "strict-origin-when-cross-origin"})
app.add_middleware(HSTS, Option={"max-age": 63072000, "includeSubDomains": True, "preload": True})
app.add_middleware(
    ContentSecurityPolicy,
    Option={
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "object-src": ["'none'"],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'self'"],
    },
    script_nonce=False,
    style_nonce=False,
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
    )


# -----------------------------------------------------------------------------
# Routers
# -----------------------------------------------------------------------------
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
