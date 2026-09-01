from app.core.database import SessionLocal
from app.models.department import Department
from app.models.issue import Issue
from app.models.profile import Profile
from sqlalchemy import func

with SessionLocal() as db:
    print("=== DEPARTMENTS ===")
    depts = db.query(Department).all()
    dept_map = {str(d.id): d.name for d in depts}
    for d in depts:
        print(f"ID: {d.id} | Name: '{d.name}' | Code: '{getattr(d, 'code', 'N/A')}'")
    
    print("\n=== ISSUES IN DB ===")
    issues = db.query(Issue.category, Issue.department_id, func.count(Issue.id)).group_by(Issue.category, Issue.department_id).all()
    for cat, dept_id, count in issues:
        dept_name = dept_map.get(str(dept_id), "Unknown")
        print(f"Category in Issue: '{cat}' | Department ID: '{dept_id}' ({dept_name}) | Total Issues: {count}")

    print("\n=== ADMIN PROFILES IN DB ===")
    profiles = db.query(Profile).filter(Profile.role != 'user').all()
    for p in profiles:
        dept_name = dept_map.get(str(p.department_id), "None")
        print(f"Email: '{p.email}' | Role: '{p.role}' | Dept ID: '{p.department_id}' ({dept_name})")
