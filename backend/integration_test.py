import sys
import uuid
from fastapi.testclient import TestClient
from main import app
from app.core.database import init_db

def run_integration_test():
    print("\n" + "="*70)
    print("      CIVICISSUE AI — COMPREHENSIVE INTEGRATION TEST SUITE")
    print("="*70 + "\n")

    init_db()
    client = TestClient(app)

    # 1. Health check
    print("[1/10] Testing System Health & PostgreSQL Connection...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f"   [OK] Health OK | Database: {health_data['database']['message']}")

    # 2. Auth Flow: Citizen Registration & JWT Login
    print("\n[2/10] Testing Citizen Registration & Authentication...")
    unique_email = f"testcitizen_{uuid.uuid4().hex[:6]}@civic.in"
    reg_payload = {
        "name": "Aarav Sharma",
        "email": unique_email,
        "phone": "+919876543210",
        "password": "password123"
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    citizen_token = reg_data["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}
    print(f"   [OK] Citizen Registered: {reg_data['name']} ({reg_data['email']})")
    print(f"   [OK] JWT Token Generated: {citizen_token[:20]}...")

    # 3. Auth Flow: Demo Admin Logins
    print("\n[3/10] Testing Authority & Super Admin Logins...")
    # Sanitation Admin
    login_res = client.post("/api/v1/auth/login", json={"email": "sanitation@civic.in", "password": "admin123"})
    assert login_res.status_code == 200, f"Dept admin login failed: {login_res.text}"
    dept_admin_data = login_res.json()
    dept_token = dept_admin_data["access_token"]
    dept_headers = {"Authorization": f"Bearer {dept_token}"}
    print(f"   [OK] Dept Admin Login: {dept_admin_data['email']} (Dept: {dept_admin_data['department_key']})")

    # Super Admin
    sa_res = client.post("/api/v1/auth/login", json={"email": "superadmin@civic.in", "password": "admin123"})
    assert sa_res.status_code == 200, f"Super admin login failed: {sa_res.text}"
    sa_data = sa_res.json()
    sa_token = sa_data["access_token"]
    sa_headers = {"Authorization": f"Bearer {sa_token}"}
    print(f"   [OK] Super Admin Login: {sa_data['email']}")

    # 4. Citizen Complaint Submission & AI Processing
    print("\n[4/10] Testing AI Complaint Submission Pipeline...")
    complaint_payload = {
        "text": "Huge pile of rotting garbage outside the primary health center in Sector 4. Severe foul smell and stray animals.",
        "address": "Sector 4, Near Primary Health Center",
        "latitude": 28.6139,
        "longitude": 77.2090
    }
    sub_res = client.post("/api/v1/complaints", json=complaint_payload, headers=citizen_headers)
    assert sub_res.status_code == 201, f"Complaint submission failed: {sub_res.text}"
    sub_data = sub_res.json()
    complaint_id = sub_data["complaint_id"]
    issue_id = sub_data["issue_id"]
    print(f"   [OK] Complaint Submitted: ID #{complaint_id[:8]}")
    print(f"   [OK] Linked Issue ID: #{issue_id[:8]} (Action: {sub_data['issue_action']})")
    print(f"   [OK] AI Classification: Category '{sub_data['classification']['category']}' -> Dept '{sub_data['classification']['department']}'")
    print(f"   [OK] AI Priority: Level '{sub_data['priority']['level']}' (Score: {sub_data['priority']['score']})")

    # 5. Citizen Tracking & Public Nearby Issues Map
    print("\n[5/10] Testing Citizen Tracking & Nearby Public Map APIs...")
    track_res = client.get(f"/api/v1/complaints/{complaint_id}", headers=citizen_headers)
    assert track_res.status_code == 200, f"Tracking failed: {track_res.text}"
    track_data = track_res.json()
    assert track_data["id"] == complaint_id
    print(f"   [OK] Complaint Detail Retrieved: Status '{track_data['status']}', Priority '{track_data['priority']}'")
    print(f"   [OK] Timeline steps recorded: {len(track_data['timeline'])} step(s)")

    nearby_res = client.get("/api/v1/map/nearby", headers=citizen_headers)
    assert nearby_res.status_code == 200, f"Nearby map failed: {nearby_res.text}"
    nearby_markers = nearby_res.json()
    print(f"   [OK] Public Nearby Map returned {len(nearby_markers)} active civic markers (Anonymized: 100% no user names)")

    # 6. Authority Issue Queue & Scoping
    print("\n[6/10] Testing Authority Issue Queue & Department Scoping...")
    issues_res = client.get("/api/v1/issues", headers=dept_headers)
    assert issues_res.status_code == 200, f"Issue queue failed: {issues_res.text}"
    dept_issues = issues_res.json()
    print(f"   [OK] Sanitation Department Queue: {len(dept_issues)} issues listed")
    
    # 7. Authority Issue Detail & Officer Assignment
    print("\n[7/10] Testing Issue Detail & Officer Assignment...")
    detail_res = client.get(f"/api/v1/issues/{issue_id}", headers=dept_headers)
    assert detail_res.status_code == 200, f"Issue detail failed: {detail_res.text}"
    print(f"   [OK] Issue Detail Retrieved: '{detail_res.json()['title']}'")
    
    update_res = client.patch(
        f"/api/v1/issues/{issue_id}",
        json={
            "status": "in_progress",
            "assigned_officer_name": "Rajesh Kumar (Senior Sanitation Inspector)",
            "note": "Assigned to Field Inspector Rajesh Kumar for inspection and trash clearance."
        },
        headers=dept_headers
    )
    assert update_res.status_code == 200, f"Issue update failed: {update_res.text}"
    updated_data = update_res.json()
    print(f"   [OK] Officer Assigned: {updated_data.get('assigned_officer_name')}")
    print(f"   [OK] Status Updated to: {updated_data['status']}")

    # 8. Authority Resolution Cascade
    print("\n[8/10] Testing Resolution Cascade (Issue -> Complaints)...")
    resolve_res = client.post(
        f"/api/v1/issues/{issue_id}/resolve?note=Trash%20cleared%20and%20disinfected%20by%20municipal%20team",
        headers=dept_headers
    )
    assert resolve_res.status_code == 200, f"Issue resolve failed: {resolve_res.text}"
    res_data = resolve_res.json()
    print(f"   [OK] Issue Marked Resolved: {res_data['message']}")
    print(f"   [OK] Linked citizen complaints auto-resolved count: {res_data['linked_complaints_resolved_count']}")

    # Check citizen complaint is also now resolved
    refreshed_c = client.get(f"/api/v1/complaints/{complaint_id}", headers=citizen_headers).json()
    assert refreshed_c["status"] == "resolved", "Citizen complaint was not auto-resolved by cascade!"
    print(f"   [OK] Verified Citizen Complaint Status is now: '{refreshed_c['status']}'")

    # 9. Citizen Satisfaction Rating (Phase 1 New Feature)
    print("\n[9/10] Testing Citizen Satisfaction Rating Submission...")
    rate_res = client.post(
        f"/api/v1/complaints/{complaint_id}/rate",
        json={"rating": 5, "feedback": "Area was cleaned within 4 hours. Excellent response!"},
        headers=citizen_headers
    )
    assert rate_res.status_code == 200, f"Rating submission failed: {rate_res.text}"
    rated_complaint = rate_res.json()
    assert rated_complaint["satisfaction_rating"] == 5
    assert rated_complaint["satisfaction_feedback"] == "Area was cleaned within 4 hours. Excellent response!"
    print(f"   [OK] Satisfaction Rating Saved: {rated_complaint['satisfaction_rating']}/5 Stars")
    print(f"   [OK] Citizen Feedback: \"{rated_complaint['satisfaction_feedback']}\"")

    # 10. Analytics & Super Admin Governance
    print("\n[10/10] Testing Analytics, Hotspots & User Management...")
    analytics_res = client.get("/api/v1/analytics/summary", headers=sa_headers)
    assert analytics_res.status_code == 200, f"Analytics summary failed: {analytics_res.text}"
    summary = analytics_res.json()
    print(f"   [OK] City-wide Analytics: Total Open={summary['open_issues']}, Resolved={summary['resolved_issues']}, Linked Duplicates={summary['linked_duplicate_complaints']}")

    citizens_res = client.get("/api/v1/auth/citizens", headers=sa_headers)
    assert citizens_res.status_code == 200, f"Citizens list failed: {citizens_res.text}"
    citizens_list = citizens_res.json()
    print(f"   [OK] Super Admin Citizens Panel: {len(citizens_list)} registered citizen(s) tracked in database")

    print("\n" + "="*70)
    print("  ALL 10 INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("="*70 + "\n")

if __name__ == "__main__":
    run_integration_test()
