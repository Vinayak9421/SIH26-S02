import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.schemas.user import CurrentUser

SECRET_KEY = "civicissue-local-jwt-secret-sih2026-hackathon"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Demo users seeded for hackathon - (email, password_hash, role, dept_key, dept_id, name)
DEMO_USERS = [
    {
        "id": "super-admin-001",
        "email": "superadmin@civic.in",
        "password": "admin123",
        "role": "super_admin",
        "department_key": None,
        "department_id": None,
        "name": "Super Administrator",
    },
    {
        "id": "dept-admin-sanitation-001",
        "email": "sanitation@civic.in",
        "password": "admin123",
        "role": "department_admin",
        "department_key": "sanitation",
        "department_id": "dept-sanitation",
        "name": "Sanitation Department Admin",
    },
    {
        "id": "dept-admin-roads-001",
        "email": "roads@civic.in",
        "password": "admin123",
        "role": "department_admin",
        "department_key": "roads_infrastructure",
        "department_id": "dept-roads",
        "name": "Roads & Infrastructure Admin",
    },
    {
        "id": "dept-admin-water-001",
        "email": "water@civic.in",
        "password": "admin123",
        "role": "department_admin",
        "department_key": "water_supply",
        "department_id": "dept-water",
        "name": "Water Supply Admin",
    },
    {
        "id": "citizen-001",
        "email": "citizen@civic.in",
        "password": "citizen123",
        "role": "citizen",
        "department_key": None,
        "department_id": None,
        "name": "Demo Citizen",
    },
]


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def find_demo_user(email: str, password: str) -> Optional[dict]:
    """Find and authenticate a demo user."""
    for user in DEMO_USERS:
        if user["email"].lower() == email.lower() and user["password"] == password:
            return user
    return None


def create_access_token(user: dict) -> str:
    """Create a local JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user.get("name", ""),
        "department_key": user.get("department_key"),
        "department_id": user.get("department_id"),
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_local_jwt(token: str) -> Optional[CurrentUser]:
    """Decode a locally-issued JWT."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role", "citizen")
        department_key = payload.get("department_key")
        department_id = payload.get("department_id")

        if not user_id:
            return None

        return CurrentUser(
            id=str(user_id),
            email=email,
            role=role,
            department_id=department_id,
            department_key=department_key,
        )
    except JWTError:
        return None


def get_all_demo_users_info() -> list:
    """Return public info about demo users for the login hint UI."""
    return [
        {
            "email": u["email"],
            "password": u["password"],
            "role": u["role"],
            "name": u["name"],
        }
        for u in DEMO_USERS
    ]
