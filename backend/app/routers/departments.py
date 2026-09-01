from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.department import Department
from app.schemas.analytics import DepartmentResponse
from app.schemas.user import CurrentUser
from app.services.ai.category_templates import CATEGORY_DEPARTMENT_MAPPING

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=List[DepartmentResponse])
async def list_departments(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Returns active departments for UI filter dropdowns and routing.
    """
    departments = db.query(Department).filter(Department.active == True).all()
    if not departments:
        # If DB is clean, auto-seed standard departments
        for key, name in CATEGORY_DEPARTMENT_MAPPING.items():
            if key == "general_review":
                continue
            dept = Department(
                name=name,
                category_key=key,
                description=f"Department managing {name}"
            )
            db.add(dept)
        db.commit()
        departments = db.query(Department).filter(Department.active == True).all()

    res = []
    for d in departments:
        res.append(
            DepartmentResponse(
                id=str(d.id),
                name=d.name,
                category_key=d.category_key,
                description=d.description,
                active=d.active
            )
        )
    return res
