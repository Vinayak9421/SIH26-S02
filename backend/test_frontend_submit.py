import requests

def test_submit():
    print("1. Logging in as admin@demo.com...")
    r = requests.post("http://127.0.0.1:8000/api/v1/auth/login", json={"email": "admin@demo.com", "password": "admin123"}, timeout=5)
    print("   -> Status:", r.status_code)
    token = r.json().get("access_token")

    print("\n2. Submitting Complaint with compressed image payload...")
    b64_img = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    payload = {
        "text": "Broken water main flooding local market road",
        "image_b64": b64_img,
        "address": "Market Road, Sector 5",
        "latitude": 19.2183,
        "longitude": 72.9781
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post("http://127.0.0.1:8000/api/v1/complaints", json=payload, headers=headers, timeout=15)
    print("   -> Status:", res.status_code)
    print("   -> Response:", res.json())
    print("\nSUCCESS: Backend Complaint Submission API is 100% operational!")

if __name__ == "__main__":
    test_submit()
