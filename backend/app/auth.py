import logging
from typing import Optional, List
from fastapi import Request, HTTPException, status
from jose import jwt, JWTError

from app.config import settings
from app.schemas.user import CurrentUser

logger = logging.getLogger("uvicorn.error")


def parse_jwt_token(token: str) -> Optional[CurrentUser]:
    """
    Decodes Supabase / standard JWT token and extracts user role and metadata.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        user_id = payload.get("sub") or payload.get("id")
        email = payload.get("email")
        
        # Extract user_metadata or app_metadata
        app_metadata = payload.get("app_metadata", {})
        user_metadata = payload.get("user_metadata", {})
        
        role = app_metadata.get("role") or user_metadata.get("role") or payload.get("role") or "citizen"
        department_id = app_metadata.get("department_id") or user_metadata.get("department_id")
        department_key = app_metadata.get("department_key") or user_metadata.get("department_key")

        # Map role (if legacy 'officer' is passed, map to 'department_admin')
        if role == "officer":
            role = "department_admin"

        return CurrentUser(
            id=str(user_id),
            email=email,
            role=role,
            department_id=department_id,
            department_key=department_key
        )
    except JWTError as e:
        logger.debug(f"JWT decode failed: {e}")
        return None


async def get_current_user(request: Request) -> CurrentUser:
    """
    FastAPI dependency to extract and authenticate current user.
    Supports JWT Bearer authorization and development demo role fallback headers.
    """
    auth_header = request.headers.get("Authorization")
    
    # 1. Bearer Token Auth
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        user = parse_jwt_token(token)
        if user:
            return user

    # 2. Development Demo Role Header Fallback (Enabled in development)
    if settings.ENVIRONMENT == "development":
        demo_role = request.headers.get("X-Demo-Role", "").strip().lower()
        if demo_role:
            # Map role
            if demo_role == "officer":
                demo_role = "department_admin"
            if demo_role not in ["citizen", "department_admin", "super_admin"]:
                demo_role = "citizen"

            demo_dept = request.headers.get("X-Demo-Department", "sanitation").strip()
            demo_user_id = request.headers.get("X-Demo-User-Id", f"demo-{demo_role}-id")

            return CurrentUser(
                id=demo_user_id,
                email=f"{demo_role}@civicissue.local",
                role=demo_role,
                department_id=demo_dept,
                department_key=demo_dept
            )

    # 3. Default fallback for unauthenticated citizen submissions
    return CurrentUser(
        id="anonymous-citizen-001",
        email="citizen@civicissue.local",
        role="citizen"
    )


def require_role(allowed_roles: List[str]):
    """Dependency factory requiring specific user roles"""
    async def role_checker(current_user: CurrentUser = None) -> CurrentUser:
        if not current_user or current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: required role in {allowed_roles}, current role is '{current_user.role if current_user else 'none'}'"
            )
        return current_user
    return role_checker
