from fastapi import APIRouter, Depends, Request

from app.core.deps import get_current_org, get_current_user
from app.core.security import limiter
from app.models import Organization, User

router = APIRouter()


@router.get("/me")
@limiter.limit("60/minute")
def get_me(
    request: Request,
    user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
) -> dict:
    """Return the authenticated user + their organization.

    In dev (no Clerk configured) this returns the synthetic dev user so the
    dashboard can be built before real auth is wired.
    """
    return {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "clerk_user_id": user.clerk_user_id,
        },
        "organization": {
            "id": str(org.id),
            "name": org.name,
            "slug": org.slug,
            "plan": org.plan,
        },
    }
