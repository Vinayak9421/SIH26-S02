from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth import get_current_user
from app.schemas.user import CurrentUser

__all__ = [
    "get_db",
    "get_current_user",
    "require_department_admin",
    "require_super_admin"
]


async def require_department_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Requires department_admin or super_admin role"""
    if current_user.role not in ["department_admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Department Administrators."
        )
    return current_user


async def require_super_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Requires super_admin role"""
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Super Administrators."
        )
    return current_user
