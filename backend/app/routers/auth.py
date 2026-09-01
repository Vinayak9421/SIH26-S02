import uuid
import hashlib
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.schemas.auth import LoginRequest, TokenResponse, RegisterRequest, DemoUserInfo
from app.services.local_auth_service import (
    find_demo_user,
    create_access_token,
    get_all_demo_users_info,
)
from app.core.database import get_db
from app.models.profile import Profile

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Local JWT login. Tries demo admin users first, then NeonDB citizen accounts.
    """
    # 1. Check demo admin users (super_admin, dept_admin)
    demo_user = find_demo_user(payload.email, payload.password)
    if demo_user:
        token = create_access_token(demo_user)
        return TokenResponse(
            access_token=token,
            role=demo_user["role"],
            name=demo_user.get("name", ""),
            email=demo_user["email"],
            department_key=demo_user.get("department_key"),
            department_id=demo_user.get("department_id"),
        )

    # 2. Check NeonDB citizen accounts (role is 'citizen' in app_role enum)
    profile = db.query(Profile).filter(
        Profile.email == payload.email.lower().strip(),
        Profile.role.in_(["citizen", "user"]),  # support both 'citizen' and legacy 'user'
        Profile.is_active == True,
    ).first()

    if not profile or profile.password_hash != _hash(payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Update last login
    profile.last_login = datetime.utcnow()
    db.commit()

    user = {
        "id": str(profile.id),   # str() ensures UUID is JSON serializable
        "email": profile.email,
        "role": profile.role,
        "name": profile.full_name or "Citizen",
        "department_key": None,
        "department_id": None,
    }
    token = create_access_token(user)
    return TokenResponse(
        access_token=token,
        role=profile.role,
        name=profile.full_name or "Citizen",
        email=profile.email,
        department_key=None,
        department_id=None,
    )


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new citizen account and persist to NeonDB profiles table.
    """
    email = payload.email.lower().strip()

    # Check for duplicate email
    existing = db.query(Profile).filter(Profile.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please log in.",
        )

    # Validate password length
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 6 characters.",
        )

    # Create new citizen profile in NeonDB
    profile = Profile(
        id=str(uuid.uuid4()),
        full_name=payload.name.strip(),
        email=email,
        phone=payload.phone,
        password_hash=_hash(payload.password),
        role="citizen",
        is_active=True,
        created_at=datetime.utcnow(),
        last_login=datetime.utcnow(),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    user = {
        "id": str(profile.id),   # str() ensures UUID is JSON serializable
        "email": profile.email,
        "role": "citizen",
        "name": profile.full_name,
        "department_key": None,
        "department_id": None,
    }
    token = create_access_token(user)
    return TokenResponse(
        access_token=token,
        role="citizen",
        name=profile.full_name,
        email=profile.email,
        department_key=None,
        department_id=None,
    )


@router.get("/demo-users", response_model=List[DemoUserInfo])
async def get_demo_users():
    """
    Returns demo users for the hackathon login hint panel.
    """
    return get_all_demo_users_info()


@router.get("/citizens", response_model=List[dict])
async def list_citizens(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Super Admin: List all registered citizen accounts.
    """
    profiles = db.query(Profile).filter(
        Profile.role.in_(["citizen", "user"]),
        Profile.is_active == True,
    ).order_by(Profile.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": str(p.id),
            "name": p.full_name,
            "email": p.email,
            "phone": p.phone,
            "role": p.role,
            "is_active": p.is_active,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "last_login": p.last_login.isoformat() if p.last_login else None,
        }
        for p in profiles
    ]


@router.patch("/citizens/{user_id}/deactivate")
async def deactivate_citizen(user_id: str, db: Session = Depends(get_db)):
    """
    Super Admin: Deactivate a citizen account.
    """
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    profile.is_active = False
    db.commit()
    return {"message": f"User {user_id} deactivated."}
