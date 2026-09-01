from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict


class CurrentUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: Literal["citizen", "department_admin", "super_admin"] = "citizen"
    department_id: Optional[str] = None
    department_key: Optional[str] = None


class ProfileResponse(BaseModel):
    id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str
    department_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
