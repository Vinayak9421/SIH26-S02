# SIH26-S02 Backend — Grievance Intelligence Platform

FastAPI backend with AI/NLP classification, priority scoring, semantic duplicate detection, and Neon PostgreSQL database connectivity.

---

## 🚀 Quickstart

### 1. Activate Virtual Environment
```bash
# Windows
cd backend
.\venv\Scripts\activate
```

### 2. Configure Environment Variables (`.env`)
Copy `.env.example` to `.env` if you haven't already:
```ini
# Neon PostgreSQL Connection String (with SSL required)
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/<dbname>?sslmode=require"

# Optional AI API keys
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

### 3. Start the FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```
- **API Documentation (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative Docs (ReDoc)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 📂 Project Architecture

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py               # Dependency injection (DB session)
│   │   └── v1/
│   │       ├── api_router.py     # Aggregated v1 API router
│   │       ├── complaints.py     # Complaint intake, query, update endpoints
│   │       └── dashboard.py      # Analytics & GIS hotspot endpoints
│   ├── core/
│   │   ├── config.py             # Pydantic Settings & environment parsing
│   │   └── database.py           # Neon PostgreSQL engine, pooling, and session maker
│   ├── models/
│   │   └── complaint.py          # SQLAlchemy Complaint model
│   ├── schemas/
│   │   └── complaint.py          # Pydantic schemas (Intake, Response, Stats, Hotspots)
│   └── services/
│       ├── ai_service.py         # AI NLP classification & priority scoring
│       ├── embedding_service.py  # Vector embeddings & cosine similarity
│       └── duplicate_service.py  # Nearest-neighbor duplicate detection
├── .env                          # Local environment secrets
├── .env.example                  # Environment template
├── main.py                       # FastAPI application entrypoint with CORS & lifespan
└── requirements.txt              # Project dependencies
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root API metadata |
| `GET` | `/health` | Server and Database connectivity health check |
| `POST` | `/api/v1/complaints` | Submit & process citizen grievance (AI classification + duplicate check) |
| `GET` | `/api/v1/complaints` | List grievances with category, department, priority, duplicate filters |
| `GET` | `/api/v1/complaints/{id}` | Detailed grievance view with AI outputs & duplicates |
| `PATCH` | `/api/v1/complaints/{id}/status` | Update grievance status (`PENDING`, `IN_PROGRESS`, `RESOLVED`) |
| `POST` | `/api/v1/complaints/seed-demo` | Seed demo records (Sector 5 water outage golden demo pair) |
| `GET` | `/api/v1/dashboard/stats` | KPI statistics & category/priority/department distributions |
| `GET` | `/api/v1/dashboard/hotspots` | Map-ready coordinates & severity weights for Leaflet map |
