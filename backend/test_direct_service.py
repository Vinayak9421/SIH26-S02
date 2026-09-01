import time
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.schemas.complaint import ComplaintCreate
from app.schemas.user import CurrentUser
from app.services.complaint_service import ComplaintService
from app.models.profile import Profile

def profile_submit():
    print("Profiling submit_complaint execution steps...")
    t0 = time.time()

    db = SessionLocal()
    print(f"[{time.time()-t0:.3f}s] DB session opened")

    real_user = db.query(Profile).filter(Profile.role == "citizen").first()
    if not real_user:
        real_user = db.query(Profile).first()
    user_id = str(real_user.id) if real_user else "citizen-001"

    current_user = CurrentUser(
        id=user_id,
        email="citizen@demo.com",
        full_name="Citizen User",
        role="citizen"
    )
    print(f"[{time.time()-t0:.3f}s] User fetched: {user_id}")

    b64_img = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

    payload = ComplaintCreate(
        text="Large pothole on main avenue",
        image_b64=b64_img,
        address="Thane West",
        latitude=19.1982,
        longitude=72.9712
    )

    t1 = time.time()
    res = ComplaintService.submit_complaint(db, payload, current_user)
    print(f"[{time.time()-t1:.3f}s] ComplaintService.submit_complaint completed! Complaint ID: #{res.complaint_id}")
    print(f"[{time.time()-t0:.3f}s] Total execution time!")

    db.close()

if __name__ == "__main__":
    profile_submit()
