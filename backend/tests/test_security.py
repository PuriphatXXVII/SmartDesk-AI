"""Tests for the security middleware stack — these guarantee that headers
required by our threat model (docs/SECURITY.md) actually reach the client."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_security_headers_present() -> None:
    """Every response from a top-level endpoint must carry the OWASP headers."""
    r = client.get("/health")
    assert r.status_code == 200

    h = r.headers
    assert h["x-content-type-options"] == "nosniff"
    assert h["x-frame-options"] == "DENY"
    assert h["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "max-age=63072000" in h["strict-transport-security"]
    assert "includeSubDomains" in h["strict-transport-security"]
    assert "preload" in h["strict-transport-security"]


def test_csp_locks_down_dangerous_directives() -> None:
    """CSP must forbid framing, plugins, and external base-uri hijacking."""
    r = client.get("/health")
    csp = r.headers["content-security-policy"]
    assert "frame-ancestors 'none'" in csp
    assert "object-src 'none'" in csp
    assert "base-uri 'self'" in csp


def test_permissions_policy_disables_invasive_apis() -> None:
    r = client.get("/health")
    pp = r.headers["permissions-policy"]
    assert "camera=()" in pp
    assert "microphone=()" in pp
    assert "geolocation=()" in pp


def test_server_header_does_not_leak_framework() -> None:
    """We strip 'Server' to avoid telling attackers exactly what's running."""
    r = client.get("/health")
    assert "server" not in {k.lower() for k in r.headers}


def test_rate_limiter_uses_memory_in_tests() -> None:
    """In non-production, SlowAPI must use memory:// (no Redis dependency)."""
    from app.core.security import _limiter_storage_uri

    assert _limiter_storage_uri.startswith("memory")


def test_redact_pii_masks_contact_details() -> None:
    """PII is stripped before it can leave for a third-party webhook endpoint."""
    from app.core.security import redact_pii

    out = redact_pii("reach me at jane@example.com, card 4111 1111 1111 1111")
    assert "jane@example.com" not in out
    assert "[EMAIL_REDACTED]" in out
    assert "4111 1111 1111 1111" not in out
