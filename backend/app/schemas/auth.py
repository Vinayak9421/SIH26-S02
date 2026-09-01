from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str
    department_key: Optional[str] = None
    department_id: Optional[str] = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = None


class DemoUserInfo(BaseModel):
    email: str
    password: str
    role: str
    name: str
