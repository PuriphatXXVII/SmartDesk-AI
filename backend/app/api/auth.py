from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import limiter

router = APIRouter()
security = HTTPBearer(auto_error=True)


@router.get("/me")
@limiter.limit("60/minute")
def get_me(
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    # TODO(week 1):
    #   1. Fetch Clerk JWKS once and cache
    #   2. Verify JWT signature, issuer, audience, expiry with PyJWT
    #   3. Load user + org from DB by clerk_user_id
    #   4. Reject if user is not active or org is suspended
    if not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing token")
    return {"user_id": "stub", "org_id": "stub", "role": "admin"}
