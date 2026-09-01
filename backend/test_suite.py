import sys
from fastapi.testclient import TestClient
from main import app
from app.core.database import Base, engine, init_db
from app.services.ai.analyze import analyze_complaint, get_ai_pipeline
from app.services.ai.duplicate_service import IssueCandidate

def test_full_civicissue_ai_backend():
    print("================================================================")
    print("  CIVICISSUE AI — FULL BACKEND & AI MODEL VERIFICATION SUITE   ")
    print("================================================================")
    
    # 1. Initialize Tables
    print("\n--- [Step 1] Initializing Database Schema ---")
    init_db()
    client = TestClient(app)

    # 2. Test Health Endpoint
    print("\n--- [Step 2] Testing /health Endpoint ---")
    res = client.get("/health")
    print("Health response:", res.status_code, res.json())
    assert res.status_code == 200

    # 3. Test AI Pipeline (Pre-warming & Embedding Check)
    print("\n--- [Step 3] Testing AI Intelligence Layer ---")
    embedder, classifier = get_ai_pipeline()
    test_text = "Ward 12 mein school ke paas teen din se kachra nahi uthaya gaya. Mosquitoes are increasing."
    analysis = analyze_complaint(test_text, latitude=19.0762, longitude=72.8777, active_issues=[])
    
    print(f"Input Text: '{test_text}'")
    print(f"AI Category: {analysis['category']} (Dept: {analysis['department']})")
    print(f"AI Confidence: {analysis['confidence']} (Review Needed: {analysis['needs_human_review']})")
    print(f"AI Priority: {analysis['priority']} (Score: {analysis['priority_score']})")
    print(f"Priority Reasons: {analysis['priority_reasons']}")
    print(f"Embedding Vector Dimension: {len(analysis['embedding'])}")
    assert analysis['category'] == "sanitation"
    assert analysis['priority'] == "high"
    assert len(analysis['embedding']) == 384

    # 4. Test Citizen Complaint Submission (POST /api/v1/complaints)
    print("\n--- [Step 4] Testing Citizen Submission: Primary Demo Complaint ---")
    headers_citizen = {
        "X-Demo-Role": "citizen",
        "X-Demo-User-Id": "demo-citizen-rahul"
    }
    payload1 = {
        "text": "Ward 12 mein school ke paas teen din se kachra nahi uthaya gaya. Mosquitoes are increasing.",
        "address": "Near municipal school, Ward 12",
        "latitude": 19.0762,
        "longitude": 72.8777
    }
    res1 = client.post("/api/v1/complaints", json=payload1, headers=headers_citizen)
    print("Submit 1 Status:", res1.status_code)
    data1 = res1.json()
    print("Submit 1 Response:")
    print(f"  Complaint ID: {data1['complaint_id']}")
    print(f"  Issue ID: {data1['issue_id']} (Action: {data1['issue_action']})")
    print(f"  Classification: {data1['classification']['category']} -> {data1['classification']['department']} (conf: {data1['classification']['confidence']})")
    print(f"  Priority: {data1['priority']['level']} (score: {data1['priority']['score']})")
    print(f"  Duplicate State: {data1['duplicate']['state']}")
    assert res1.status_code == 201
    assert data1['issue_action'] == "created_new_issue"
    first_issue_id = data1['issue_id']

    # 5. Test Duplicate Complaint Submission (English Paraphrase nearby within 140m)
    print("\n--- [Step 5] Testing Duplicate Complaint Submission (Paraphrase 140m away) ---")
    payload2 = {
        "text": "Garbage has not been picked up outside municipal school for three days and waste is overflowing.",
        "address": "Municipal School Gate 2, Ward 12",
        "latitude": 19.0770,  # ~100m away
        "longitude": 72.8780
    }
    res2 = client.post("/api/v1/complaints", json=payload2, headers=headers_citizen)
    print("Submit 2 Status:", res2.status_code)
    data2 = res2.json()
    print("Submit 2 Duplicate Response:")
    print(f"  Complaint ID: {data2['complaint_id']}")
    print(f"  Issue ID: {data2['issue_id']} (Action: {data2['issue_action']})")
    print(f"  Duplicate State: {data2['duplicate']['state']}")
    print(f"  Similarity: {data2['duplicate']['semantic_similarity']}, Distance: {data2['duplicate']['distance_meters']}m")
    assert res2.status_code == 201
    assert data2['issue_action'] == "linked_to_existing_issue"
    assert data2['issue_id'] == first_issue_id

    # 6. Test Non-Duplicate Same Text far away (> 5km away)
    print("\n--- [Step 6] Testing Same Text at Faraway Location (5km away) ---")
    payload3 = {
        "text": "Garbage has not been picked up outside school for three days.",
        "address": "Ward 45 School Zone",
        "latitude": 19.1200,  # ~5km away
        "longitude": 72.9100
    }
    res3 = client.post("/api/v1/complaints", json=payload3, headers=headers_citizen)
    data3 = res3.json()
    print("Submit 3 Status:", res3.status_code)
    print(f"  Complaint ID: {data3['complaint_id']}")
    print(f"  Issue ID: {data3['issue_id']} (Action: {data3['issue_action']})")
    print(f"  Duplicate State: {data3['duplicate']['state']}")
    assert res3.status_code == 201
    assert data3['issue_action'] == "created_new_issue"
    assert data3['issue_id'] != first_issue_id

    # 7. Test Citizen Mine Endpoint
    print("\n--- [Step 7] Testing Citizen Complaints History (GET /api/v1/complaints/mine) ---")
    res_mine = client.get("/api/v1/complaints/mine", headers=headers_citizen)
    print("Citizen complaints count:", len(res_mine.json()))
    assert res_mine.status_code == 200
    assert len(res_mine.json()) >= 3

    # 8. Test Authority Issue Queue (GET /api/v1/issues)
    print("\n--- [Step 8] Testing Authority Issue Queue (GET /api/v1/issues) ---")
    headers_admin = {
        "X-Demo-Role": "department_admin",
        "X-Demo-Department": "sanitation",
        "X-Demo-User-Id": "demo-admin-officer"
    }
    res_issues = client.get("/api/v1/issues", headers=headers_admin)
    print("Authority issues queue status:", res_issues.status_code)
    issues_list = res_issues.json()
    print(f"Total active issues for Sanitation Dept: {len(issues_list)}")
    for iss in issues_list:
        print(f"  - [{iss['priority'].upper()}] {iss['title']} (Linked Complaints: {iss['complaint_count']}, Status: {iss['status']})")
    assert res_issues.status_code == 200
    assert len(issues_list) >= 1

    # 9. Test Issue Detail (GET /api/v1/issues/{id})
    print(f"\n--- [Step 9] Testing Issue Detail View for Issue '{first_issue_id}' ---")
    res_detail = client.get(f"/api/v1/issues/{first_issue_id}", headers=headers_admin)
    detail_data = res_detail.json()
    print("Issue Detail:")
    print(f"  Title: {detail_data['title']}")
    print(f"  Linked Complaints Count: {len(detail_data['linked_complaints'])}")
    print(f"  Timeline Entries: {len(detail_data['timeline'])}")
    assert res_detail.status_code == 200
    assert len(detail_data['linked_complaints']) == 2

    # 10. Test Authority Resolution Cascade (POST /api/v1/issues/{id}/resolve)
    print(f"\n--- [Step 10] Testing Authority Issue Resolution Cascade ---")
    res_resolve = client.post(f"/api/v1/issues/{first_issue_id}/resolve?note=Sanitation%20truck%20dispatched%20and%20waste%20cleared", headers=headers_admin)
    resolve_data = res_resolve.json()
    print("Resolve Response:", resolve_data)
    assert res_resolve.status_code == 200
    assert resolve_data['linked_complaints_resolved_count'] == 2

    # 11. Test Citizen Complaint Reflects Resolved State
    print("\n--- [Step 11] Verifying Citizen View Reflects Auto-Resolution ---")
    res_c1 = client.get(f"/api/v1/complaints/{data1['complaint_id']}", headers=headers_citizen)
    c1_data = res_c1.json()
    print(f"Complaint 1 Status: {c1_data['status']} (Issue Status: {c1_data['issue_status']})")
    assert c1_data['status'] == "resolved"
    assert c1_data['issue_status'] == "resolved"

    # 12. Test Analytics Summary & GIS Hotspots
    print("\n--- [Step 12] Testing Analytics Summary & GIS Hotspots ---")
    res_analytics = client.get("/api/v1/analytics/summary", headers=headers_admin)
    print("Analytics Summary:", res_analytics.json())
    assert res_analytics.status_code == 200

    res_hotspots = client.get("/api/v1/map/hotspots", headers=headers_admin)
    print(f"GIS Hotspots Count: {len(res_hotspots.json())}")
    for h in res_hotspots.json():
        print(f"  Hotspot {h['hotspot_key']} -> {h['count']} reports, dominant: {h['dominant_category']}, prio: {h['highest_priority']}")
    assert res_hotspots.status_code == 200

    res_departments = client.get("/api/v1/departments", headers=headers_citizen)
    print(f"Departments Available: {len(res_departments.json())}")
    assert res_departments.status_code == 200

    print("\n================================================================")
    print("  ALL CIVICISSUE AI ENDPOINTS & PIPELINES VERIFIED SUCCESSFULLY! ")
    print("================================================================")


if __name__ == "__main__":
    test_full_civicissue_ai_backend()
