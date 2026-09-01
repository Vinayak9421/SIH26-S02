# SIH26S02 — 3-Person Build Plan

## AI-Based Citizen Grievance Classification, Prioritization and Duplicate Complaint Detection

> **Goal:** Build a convincing working MVP in approximately four hours with three people working in parallel.
>
> **Team split:**
> 1. Frontend Engineer
> 2. Backend Engineer
> 3. AI / Ingestion Engineer

---

# 0. Final Product Definition

Build a web platform called **CivicIssue AI** where:

1. A citizen submits a civic complaint with text and location.
2. The AI layer classifies it into a civic department, assigns explainable priority, and checks whether it is a duplicate of an existing underlying issue.
3. The backend creates a new Issue or links the complaint to an existing Issue.
4. An authority officer sees issue-level workload, duplicate counts, priority, status, and GIS hotspots.
5. The officer updates an Issue status, and the citizen sees that update in their complaint timeline.

## Core insight: Complaint vs Issue

```text
Complaint = one citizen report
Issue = the real-world civic problem being acted upon

Many Complaints → One Underlying Issue
```

Example:

```text
Complaint 1: “Garbage has not been picked up outside Building 4.”
Complaint 2: “Building 4 ke paas kachra teen din se pada hai.”
Complaint 3: “Waste is overflowing near Building 4.”

All three link to:
Issue: “Missed waste collection near Building 4”
```

---

# 1. Non-Negotiable MVP Scope

## MUST BUILD

- Citizen complaint submission
- Complaint text + map location / latitude / longitude
- Multilingual-friendly embedding-based analysis
- Classification into six departments
- Explainable priority score
- Semantic duplicate detection
- Complaint-to-Issue linking or Issue creation
- Citizen complaint history/status view
- Authority issue queue
- Authority status update
- Basic RBAC / role switching or Supabase Auth
- Seeded demo data

## SHOULD BUILD

- Leaflet map with issue markers and hotspot circles
- Dashboard KPI cards
- Filters by department, status, priority
- Possible-duplicate review state

## ONLY IF CORE IS DONE

- DBSCAN clustering
- Image upload
- Charts beyond basic KPI cards
- Email/SMS notifications
- Fine-tuned classification model
- LLM-generated summaries

## DO NOT BUILD IN FOUR HOURS

- Mobile application
- Voice intake
- Complex workflow engine
- Production-grade notification service
- Separate vector database
- Separate admin panel for every configuration option
- Full CPGRAMS integration

---

# 2. Final Technology Contract

All three team members must use this exact stack to avoid integration conflicts.

| Layer | Decision | Reason |
|---|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS | Fast UI iteration and simple deployment |
| Mapping | React-Leaflet + OpenStreetMap | Free, no map API key needed |
| Backend | FastAPI + Python | Best fit for ML/embedding integration |
| Database | Supabase PostgreSQL | Managed database and authentication |
| Authentication | Supabase Auth JWT | Fast secure login and role-aware profiles |
| Vector storage | pgvector if configured; Python cosine fallback | Avoid separate vector infrastructure |
| AI model | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | One multilingual embedding model supports similarity/classification |
| Deployment | Vercel + Render/Railway + Supabase | Fast hackathon-friendly deployment |

The selected embedding model maps sentences and paragraphs into 384-dimensional dense vectors suitable for semantic similarity tasks. [page:45]

---

# 3. Shared Integration Contract

## Shared repository layout

```text
sih26s02-grievance-ai/
├── frontend/                  # Person 1 owns
├── backend/                   # Person 2 owns
├── ingestion/                 # Person 3 owns
├── database/                  # Person 2 owns schema; Person 3 owns seed data
├── docs/
│   ├── api-contract.md
│   ├── demo-script.md
│   └── decisions.md
├── .env.example
└── README.md
```

## Required branch strategy

```text
main                 = only tested, demo-ready code
frontend              = Person 1 working branch
backend               = Person 2 working branch
ingestion-ai          = Person 3 working branch
```

Rules:

- Do not directly push unfinished work to `main`.
- Commit small working changes every 20–30 minutes.
- Freeze request/response shapes in the first 15 minutes.
- Frontend initially uses mock JSON while backend is unfinished.
- Use exactly the field names in this document.

## Shared entities

```typescript
type Priority = "low" | "medium" | "high" | "critical";
type ComplaintStatus = "pending" | "in_progress" | "resolved" | "rejected";
type IssueStatus = "open" | "in_progress" | "resolved";
type UserRole = "citizen" | "officer" | "department_admin" | "super_admin";
type DuplicateState = "none" | "possible" | "linked";
```

## Shared department IDs / keys

```text
sanitation     → Solid Waste & Sanitation
water          → Water Supply
roads          → Roads & Infrastructure
streetlights   → Electrical / Street Lighting
health         → Public Health & Vector Control
traffic        → Traffic & Public Transport
general_review → General Review Queue
```

---

# PART 1 — FRONTEND ENGINEER

# 4. Frontend Ownership

## Person 1 mission

Build a visually convincing, responsive citizen and authority web application that makes the AI workflow obvious to judges within seconds.

The frontend engineer does **not** wait for the backend. Use mock API fixtures during the first hour, then switch to real endpoints.

## Frontend deliverables

1. Authentication / demo role selector
2. Citizen dashboard
3. Complaint submission form
4. AI result confirmation panel
5. Citizen complaint detail and status timeline
6. Authority dashboard
7. Issue detail panel/page
8. GIS map and hotspot visualization
9. Filters, loading states, error states
10. API client integration

---

# 5. Frontend Setup

## Install

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom axios lucide-react
npm install leaflet react-leaflet
npm install -D tailwindcss postcss autoprefixer
```

Optional only if team already knows it:

```bash
npm install @supabase/supabase-js
```

## Frontend structure

```text
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── complaints.ts
│   │   ├── issues.ts
│   │   └── analytics.ts
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── ComplaintForm.tsx
│   │   ├── ComplaintCard.tsx
│   │   ├── IssueCard.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── StatusTimeline.tsx
│   │   ├── AIAnalysisPanel.tsx
│   │   ├── HotspotMap.tsx
│   │   ├── KPIGrid.tsx
│   │   └── FilterBar.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── CitizenDashboardPage.tsx
│   │   ├── SubmitComplaintPage.tsx
│   │   ├── ComplaintDetailPage.tsx
│   │   ├── AuthorityDashboardPage.tsx
│   │   ├── IssuesPage.tsx
│   │   ├── IssueDetailPage.tsx
│   │   └── MapPage.tsx
│   ├── mocks/
│   │   └── fixtures.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

---

# 6. Frontend Page Requirements

## 6.1 Login / Demo Mode

### Page: `/login`

Purpose: Authenticate with Supabase Auth if ready. If authentication blocks demo integration, expose a temporary **Demo Role Selector**.

Components:

- Email input
- Password input
- Login button
- Demo buttons: `Citizen Demo`, `Sanitation Officer Demo`, `Admin Demo`

Temporary fallback behavior:

```text
Citizen Demo → store role = citizen in localStorage
Officer Demo → store role = officer, department = sanitation
Admin Demo → store role = department_admin, department = sanitation
```

Do not present this fallback as production authentication. Replace it when Supabase Auth is operational.

---

## 6.2 Citizen Dashboard

### Page: `/citizen/dashboard`

Purpose: Help citizens immediately submit a complaint and track their own reports.

Above the fold:

```text
[ Welcome, Mihir / Citizen ]            [ + Submit Complaint ]

[ Total Submitted ] [ In Progress ] [ Resolved ]

My Recent Complaints
[ Priority ] [ Complaint summary ] [ Issue ID ] [ Status ] [ Updated ]
```

Actions:

- Click `Submit Complaint`
- Click complaint card to open detail
- Filter by status

API calls:

```text
GET /api/v1/complaints/mine
```

---

## 6.3 Submit Complaint

### Page: `/citizen/submit`

Purpose: Submit a complaint and display live AI results.

Required fields:

- `text`: textarea, minimum 10 characters
- `address`: optional text field
- `latitude`: optional numeric field or map pin
- `longitude`: optional numeric field or map pin

Recommended UX:

```text
Describe the issue
[ textarea ]

Location
[ Address / Landmark                 ]
[ Use demo location ] [ Select on map ]

[ Submit Complaint ]
```

After successful submission, show the AI analysis result immediately:

```text
Complaint submitted successfully

Department: Solid Waste & Sanitation
Priority: HIGH
Why: Mosquito/public health risk; school nearby; issue persisted for three days

Duplicate result: Similar active issue found 140 m away
Underlying issue: Missed waste collection near municipal school, Ward 12
Linked reports: 13

[ Track Complaint ]
```

API call:

```text
POST /api/v1/complaints
```

Request:

```json
{
  "text": "Ward 12 mein school ke paas teen din se kachra nahi uthaya gaya. Mosquitoes are increasing.",
  "address": "Near municipal school, Ward 12",
  "latitude": 19.0762,
  "longitude": 72.8777
}
```

---

## 6.4 Complaint Detail

### Page: `/citizen/complaints/:complaintId`

Purpose: Make status and AI routing transparent to the citizen.

Components:

- Complaint text
- Category/department badge
- Priority badge
- Status timeline
- Linked Issue summary
- “Similar reports are grouped to help authorities resolve the shared civic issue faster” note

Show only safe, user-facing AI information:

- Department
- Priority level
- Plain-language priority reason
- Issue link / issue status

Do not show:

- Raw embedding vectors
- Threshold values
- Other citizens’ identity or complaint text
- Internal officer notes

API call:

```text
GET /api/v1/complaints/{complaint_id}
```

---

## 6.5 Authority Dashboard

### Page: `/authority/dashboard`

Purpose: This is the main judge-facing page. It should tell the operational story without requiring explanation.

Above-the-fold layout:

```text
CivicIssue AI | Sanitation Department | Officer Name

[ Open Issues ] [ Critical ] [ High Priority ] [ Duplicates Consolidated ]

Critical & High-Priority Issue Queue                 Geographic Hotspots
[ Issue | Reports | Priority | Location | Status ]    [ Leaflet Map ]
[ ... ]

[ Category count ] [ Status breakdown ] [ Recent activity ]
```

Required table fields:

| Field | Display |
|---|---|
| Issue title | Human-readable title |
| Category | Category badge |
| Priority | Color priority badge |
| Linked complaints | Prominent count |
| Location | Address / distance / ward |
| Status | Status badge |
| Assigned officer | Name or Unassigned |
| AI review | `Auto-classified` or `Needs review` |

API calls:

```text
GET /api/v1/issues
GET /api/v1/analytics/summary
GET /api/v1/map/hotspots
```

---

## 6.6 Issue Detail

### Page: `/authority/issues/:issueId`

Purpose: Treat the Underlying Issue as the actual unit of authority action.

Components:

- Issue title and status
- Priority and explanation
- Department and assigned officer
- Map location
- Linked complaint count
- Linked complaints list (text preview only)
- Status update buttons
- Human override controls, if backend supports them

Actions:

```text
[ Take ownership ]
[ Move to In Progress ]
[ Resolve Issue ]
[ Mark duplicate link incorrect ] (admin / optional)
```

API calls:

```text
GET /api/v1/issues/{issue_id}
PATCH /api/v1/issues/{issue_id}
POST /api/v1/issues/{issue_id}/resolve
```

---

## 6.7 GIS Map

### Page: `/authority/map`

Purpose: Visualize operational concentration, not merely decorative pins.

Map display:

- Marker for each Issue
- Marker color by priority
- Marker popup: title, category, status, linked complaints
- Hotspot circles: circle radius based on open complaint/issue count
- Filters: category, priority, status

Minimal viable map:

```text
React-Leaflet MapContainer
  ├── TileLayer from OpenStreetMap
  ├── Marker for each active Issue
  └── Circle for each hotspot aggregate
```

API calls:

```text
GET /api/v1/map/issues
GET /api/v1/map/hotspots
```

---

# 7. Frontend Component Contracts

## `PriorityBadge`

| Priority | Color |
|---|---|
| low | gray/slate |
| medium | blue |
| high | orange |
| critical | red |

## `StatusBadge`

| Status | Color |
|---|---|
| pending/open | slate |
| in_progress | blue |
| resolved | green |
| rejected | red/gray |

## `AIAnalysisPanel`

Props:

```typescript
interface AIAnalysis {
  category: string;
  department: string;
  confidence: number;
  needs_human_review: boolean;
  priority: "low" | "medium" | "high" | "critical";
  priority_score: number;
  priority_reasons: string[];
  duplicate_state: "none" | "possible" | "linked";
  matched_issue_title?: string;
  semantic_similarity?: number;
  distance_meters?: number;
}
```

Rules:

- Always render priority reason list when available
- Render duplicate card only for `possible` or `linked`
- Render amber human-review banner when `needs_human_review = true`

---

# 8. Frontend API Contract

## Required API client shape

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function submitComplaint(payload: {
  text: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}) {
  return api.post("/complaints", payload);
}
```

## Submit response shape

```json
{
  "complaint_id": "uuid",
  "issue_id": "uuid",
  "issue_action": "linked_to_existing_issue",
  "classification": {
    "category": "sanitation",
    "department": "Solid Waste & Sanitation",
    "confidence": 0.86,
    "needs_human_review": false
  },
  "priority": {
    "level": "high",
    "score": 52,
    "reasons": [
      "Public-health risk: mosquitoes (+20)",
      "Sensitive location: school (+15)",
      "Persistent duration: three days (+10)"
    ]
  },
  "duplicate": {
    "state": "linked",
    "semantic_similarity": 0.89,
    "distance_meters": 140,
    "matched_issue_title": "Missed waste collection near municipal school, Ward 12"
  }
}
```

## Frontend mock fixture

Create `src/mocks/fixtures.ts` with this exact submit response, plus 10 issues and 20 complaints. It prevents frontend blocking.

---

# 9. Frontend Definition of Done

The frontend is done when:

- Citizen can submit a complaint and see AI output
- Citizen can see complaint timeline
- Authority can see priority-ranked issue queue
- Authority can open Issue details and update status
- A map displays at least markers and hotspot circles
- UI clearly communicates linked complaint counts and duplicate impact
- All pages handle loading/error state
- The app works with either mock data or live backend without page redesign

---

# PART 2 — BACKEND ENGINEER

# 10. Backend Ownership

## Person 2 mission

Build a stable FastAPI orchestration layer that:

- validates requests,
- authorizes users,
- persists complaints/issues,
- invokes the AI/Ingestion service,
- serves dashboard, map, and analytics APIs,
- makes the Complaint → Issue workflow reliable.

The backend engineer owns **database schema and API integration**. Person 3 owns AI logic and seed ingestion, but backend owns the public API contract.

---

# 11. Backend Setup

## Install

```bash
mkdir backend && cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install fastapi uvicorn pydantic-settings python-dotenv supabase python-jose[cryptography] httpx
pip install numpy scikit-learn
```

If directly importing AI functions from the ingestion package:

```bash
pip install sentence-transformers torch
```

## Backend structure

```text
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│   ├── auth.py
│   ├── routers/
│   │   ├── health.py
│   │   ├── complaints.py
│   │   ├── issues.py
│   │   ├── analytics.py
│   │   ├── map.py
│   │   └── departments.py
│   ├── schemas/
│   │   ├── complaint.py
│   │   ├── issue.py
│   │   ├── analytics.py
│   │   └── user.py
│   ├── services/
│   │   ├── complaint_service.py
│   │   ├── issue_service.py
│   │   ├── auth_service.py
│   │   ├── analytics_service.py
│   │   └── ai_client.py
│   └── repositories/
│       ├── complaint_repository.py
│       ├── issue_repository.py
│       └── department_repository.py
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

# 12. Database Schema Ownership

## Required SQL schema

```sql
create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category_key text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'citizen'
    check (role in ('citizen', 'officer', 'department_admin', 'super_admin')),
  department_id uuid references departments(id),
  created_at timestamptz not null default now()
);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id),
  assigned_officer_id uuid references profiles(id),
  title text not null,
  summary text,
  category text not null,
  representative_embedding vector(384),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  priority_score integer not null default 0,
  complaint_count integer not null default 0,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  latitude double precision,
  longitude double precision,
  address text,
  hotspot_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid references profiles(id),
  issue_id uuid references issues(id),
  department_id uuid references departments(id),
  text text not null,
  normalized_text text,
  language_hint text,
  embedding vector(384),
  ai_category text,
  ai_confidence numeric,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  priority_score integer not null default 0,
  priority_reasons jsonb not null default '[]'::jsonb,
  duplicate_state text not null default 'none'
    check (duplicate_state in ('none', 'possible', 'linked')),
  duplicate_of_issue_id uuid references issues(id),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'resolved', 'rejected')),
  latitude double precision,
  longitude double precision,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists issue_status_history (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists issues_department_status_idx
on issues (department_id, status, priority_score desc);

create index if not exists complaints_issue_idx
on complaints (issue_id);

create index if not exists complaints_citizen_idx
on complaints (citizen_id, created_at desc);

create index if not exists complaints_department_idx
on complaints (department_id, status, priority, created_at desc);
```

## Seed departments

```sql
insert into departments (name, category_key, description)
values
  ('Solid Waste & Sanitation', 'sanitation', 'Garbage, litter, drains and sanitation'),
  ('Water Supply', 'water', 'Water supply, leaks and pressure'),
  ('Roads & Infrastructure', 'roads', 'Potholes, roads and public infrastructure'),
  ('Electrical / Street Lighting', 'streetlights', 'Streetlights and public electrical hazards'),
  ('Public Health & Vector Control', 'health', 'Mosquitoes, stagnant water and health hazards'),
  ('Traffic & Public Transport', 'traffic', 'Signals, public transport and traffic safety'),
  ('General Review Queue', 'general_review', 'Low confidence/manual routing queue')
on conflict (category_key) do nothing;
```

---

# 13. Backend API Requirements

## Authentication dependency

Implement a reusable dependency:

```python
async def get_current_user(request: Request) -> CurrentUser:
    """Validate Supabase JWT; return user id, role, department_id."""
```

Minimum fallback for local development:

```text
X-Demo-Role: citizen | officer | department_admin
X-Demo-Department: sanitation
```

Only accept the fallback when `ENVIRONMENT=development`.

## Required endpoints

### Health

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | Deployment and integration test |

### Complaint endpoints

| Method | Route | Role | Required behavior |
|---|---|---|---|
| POST | `/api/v1/complaints` | Citizen | Validate, analyze, create/link Issue, persist, return AI result |
| GET | `/api/v1/complaints/mine` | Citizen | Return citizen’s own complaints |
| GET | `/api/v1/complaints/{complaint_id}` | Owner/scoped authority | Return complaint, issue summary, timeline |
| GET | `/api/v1/complaints` | Officer/Admin | Return department-scoped queue |
| PATCH | `/api/v1/complaints/{complaint_id}/status` | Officer/Admin | Status update with audit/history |

### Issue endpoints

| Method | Route | Role | Required behavior |
|---|---|---|---|
| GET | `/api/v1/issues` | Officer/Admin | Filter by department/status/priority |
| GET | `/api/v1/issues/{issue_id}` | Scoped authority or linked citizen | Issue details + linked complaint previews |
| PATCH | `/api/v1/issues/{issue_id}` | Officer/Admin | Update status/assignee/priority with validation |
| POST | `/api/v1/issues/{issue_id}/resolve` | Officer/Admin | Resolve issue and linked unresolved complaints |
| POST | `/api/v1/complaints/{complaint_id}/unlink-issue` | Department Admin | Create separate Issue from false duplicate; optional |

### Dashboard endpoints

| Method | Route | Role | Required behavior |
|---|---|---|---|
| GET | `/api/v1/analytics/summary` | Officer/Admin | KPI totals, role/department scoped |
| GET | `/api/v1/map/issues` | Officer/Admin | Map-ready Issue marker data |
| GET | `/api/v1/map/hotspots` | Officer/Admin | Geo-grid hotspot aggregates |
| GET | `/api/v1/departments` | Any authenticated | Department dropdown/filter data |

---

# 14. Backend Orchestration Flow

## POST `/complaints` exact flow

```text
1. Authenticate citizen
2. Validate text length and coordinate ranges
3. Call ingestion/analyze service
4. Receive category, confidence, embedding, priority, and duplicate match
5. If confirmed duplicate:
   - increment existing Issue complaint_count
   - recalculate Issue priority
   - create Complaint linked to matched Issue
6. Else:
   - create new Issue
   - create Complaint linked to new Issue
7. Create initial complaint status history
8. Return rich AI result payload expected by frontend
```

## Important transaction rule

Complaint creation and Issue update must happen together. If using Supabase client without SQL transaction support, keep the flow simple and add error handling. In a production system, use a PostgreSQL stored procedure or transaction.

## Issue priority recomputation

```python
PRIORITY_RANK = {
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4,
}

# New issue priority = complaint priority
# Existing issue priority = max(existing priority, incoming complaint priority)
# Optional: add small impact increase for linked reports, cap at critical
```

## Issue resolution behavior

When officer resolves an Issue:

1. Set `issues.status = resolved`
2. Set `issues.resolved_at = now()`
3. Update linked complaints still pending/in_progress to `resolved`
4. Add issue and complaint history records
5. Return count of citizen complaints updated

---

# 15. Backend Schemas

## Submit complaint schema

```python
from pydantic import BaseModel, Field
from typing import Optional

class ComplaintCreate(BaseModel):
    text: str = Field(min_length=10, max_length=2000)
    address: Optional[str] = Field(default=None, max_length=300)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
```

## Update issue schema

```python
from pydantic import BaseModel
from typing import Optional, Literal

class IssueUpdate(BaseModel):
    status: Optional[Literal["open", "in_progress", "resolved"]] = None
    priority: Optional[Literal["low", "medium", "high", "critical"]] = None
    assigned_officer_id: Optional[str] = None
    note: Optional[str] = None
```

## Required submit response schema

```python
class ComplaintSubmitResponse(BaseModel):
    complaint_id: str
    issue_id: str
    issue_action: Literal["created_new_issue", "linked_to_existing_issue", "possible_duplicate"]
    classification: dict
    priority: dict
    duplicate: dict
```

---

# 16. Backend RBAC Rules

## Access rules

```text
Citizen:
- POST complaint
- GET own complaint list/details
- Can access linked Issue summary only

Officer:
- GET issues/complaints only within own department
- PATCH issue status within own department
- Cannot change department mapping for another department

Department Admin:
- All Officer rights in their department
- May assign officers
- May override duplicate link and priority

Super Admin:
- Full access
```

## Required authorization checks

```python
if current_user.role == "citizen":
    assert complaint.citizen_id == current_user.id

if current_user.role in {"officer", "department_admin"}:
    assert issue.department_id == current_user.department_id

if action == "unlink_issue":
    assert current_user.role in {"department_admin", "super_admin"}
```

Never rely on hiding buttons in the frontend as authorization.

---

# 17. Backend Analytics and GIS Queries

## Summary response

```json
{
  "open_issues": 18,
  "critical_issues": 2,
  "high_priority_issues": 6,
  "linked_duplicate_complaints": 41,
  "resolved_issues": 7,
  "department_breakdown": [
    {"category": "sanitation", "count": 8},
    {"category": "water", "count": 4}
  ],
  "priority_breakdown": [
    {"priority": "critical", "count": 2},
    {"priority": "high", "count": 6}
  ]
}
```

## Hotspot grouping logic

No DBSCAN is required for core MVP. Calculate a grid key:

```python
def hotspot_key(latitude: float, longitude: float) -> str:
    return f"{round(latitude, 3)}:{round(longitude, 3)}"
```

Then aggregate open Issues or complaints:

```text
GROUP BY hotspot_key
COUNT(*) → hotspot_count
MAX(priority_score) → highest_priority
AVG(latitude/longitude) → hotspot center
```

Return:

```json
[
  {
    "hotspot_key": "19.076:72.878",
    "latitude": 19.0762,
    "longitude": 72.8777,
    "count": 13,
    "dominant_category": "sanitation",
    "highest_priority": "high"
  }
]
```

---

# 18. Backend Definition of Done

The backend is done when:

- `/health` works
- `POST /complaints` returns exactly the agreed shape
- Complaint persists with AI metadata
- Complaint links to existing Issue or creates new Issue
- Officer can see department-scoped issues
- Officer status update persists and reaches citizen view
- Map/hotspot endpoint returns coordinates/counts
- Summary endpoint returns KPI data
- Unauthorized citizen cannot fetch authority queue
- API docs at `/docs` make manual testing possible

---

# PART 3 — AI / INGESTION ENGINEER

# 19. AI and Ingestion Ownership

## Person 3 mission

Build the intelligence and realistic demo data layer:

1. Load multilingual embedding model
2. Produce embeddings
3. Classify complaint category
4. Calculate explainable priority
5. Find duplicate/underlying Issue candidates
6. Build synthetic seed records and expected labels
7. Seed database or hand JSON fixtures to backend
8. Run a small honest evaluation set

This role must deliver a simple, callable analysis interface to the backend.

---

# 20. AI Setup

## Install

```bash
mkdir ingestion && cd ingestion
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install sentence-transformers torch numpy scikit-learn pandas faker
```

## Ingestion structure

```text
ingestion/
├── ai/
│   ├── __init__.py
│   ├── embedding_service.py
│   ├── category_templates.py
│   ├── classification_service.py
│   ├── priority_service.py
│   ├── duplicate_service.py
│   ├── geo_service.py
│   └── analyze.py
├── data/
│   ├── synthetic_complaints.json
│   ├── expected_labels.json
│   └── department_templates.json
├── scripts/
│   ├── generate_seed_data.py
│   ├── seed_supabase.py
│   └── evaluate.py
├── tests/
│   └── test_analysis.py
└── requirements.txt
```

---

# 21. Embedding Model

## Exact model

```python
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
```

This model is selected because it produces compact 384-dimensional dense sentence embeddings for semantic similarity, and avoids adding a separate runtime classifier for a short hackathon build. [page:45]

## Required API

```python
from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer(
            "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        )

    def encode_one(self, text: str) -> list[float]:
        return self.model.encode(text, normalize_embeddings=True).tolist()

    def encode_many(self, texts: list[str]) -> list[list[float]]:
        return self.model.encode(texts, normalize_embeddings=True).tolist()
```

Use `normalize_embeddings=True` so dot product equals cosine similarity.

---

# 22. Classification Design

## Do not train a classifier in the MVP

Use template-based semantic classification. You already need embeddings for duplicates, so reusing the same model reduces setup time, infrastructure, and failure points.

## Category templates

Create 3–5 templates per category, including English/Hindi/Hinglish examples.

```python
CATEGORY_TEMPLATES = {
    "sanitation": [
        "garbage collection missed, waste overflowing, litter on road",
        "unclean street, garbage pile, solid waste disposal complaint",
        "kachra nahi uthaya gaya, gandi safai aur kooda jama hai",
        "कचरा नहीं उठाया गया, गंदगी और कूड़ा जमा है"
    ],
    "water": [
        "water supply unavailable, pipeline leak, water pressure issue",
        "paani nahi aa raha hai, pipe se leakage ho raha hai",
        "पानी नहीं आ रहा है, पानी की पाइपलाइन से रिसाव हो रहा है"
    ],
    "roads": [
        "pothole, damaged road, broken footpath, unsafe road surface",
        "sadak mein gaddha hai aur road kharab hai",
        "सड़क में गड्ढा है और सड़क खराब है"
    ],
    "streetlights": [
        "streetlight not working, dark lane, exposed electrical wire",
        "street light band hai, gali andheri hai, wire exposed hai",
        "स्ट्रीट लाइट खराब है और सड़क अंधेरी है"
    ],
    "health": [
        "mosquito breeding, stagnant water, sanitation health hazard",
        "machhar badh rahe hain, ganda paani jama hai",
        "मच्छरों का प्रकोप और रुका हुआ गंदा पानी"
    ],
    "traffic": [
        "traffic signal not working, dangerous junction, bus service issue",
        "traffic signal kharab hai aur junction par jam hai",
        "ट्रैफिक सिग्नल खराब है और जाम लग रहा है"
    ]
}
```

## Classification algorithm

```python
import numpy as np

class CategoryClassifier:
    def __init__(self, embedder, templates):
        self.embedder = embedder
        self.templates = templates
        self.template_vectors = {
            category: np.array(embedder.encode_many(texts))
            for category, texts in templates.items()
        }

    def classify(self, text: str) -> dict:
        vector = np.array(self.embedder.encode_one(text))
        scores = {
            category: float(np.max(vectors @ vector))
            for category, vectors in self.template_vectors.items()
        }
        category = max(scores, key=scores.get)
        confidence = scores[category]
        return {
            "category": category,
            "confidence": round(confidence, 3),
            "all_scores": {k: round(v, 3) for k, v in scores.items()}
        }
```

## Confidence policy

| Score | Action |
|---:|---|
| `>= 0.72` | Auto-route to predicted department |
| `0.58–0.71` | Suggested route + needs human review |
| `< 0.58` | `general_review` + needs human review |

These values are MVP calibration points. Tune them using your synthetic test examples before the final demo.

---

# 23. Priority Design

## Approach

Use deterministic, explainable rules. Do not call an LLM or claim clinically/governmentally validated urgency.

## Keyword families

```python
SAFETY_TERMS = [
    "fire", "sparking", "electric shock", "exposed wire", "live wire",
    "accident", "collapse", "gas leak", "dangerous", "hazard",
    "आग", "करंट", "खुला तार", "दुर्घटना", "खतरा"
]

EMERGENCY_TERMS = [
    "emergency", "immediately", "urgent", "immediate", "jaldi",
    "तुरंत", "आपातकाल"
]

HEALTH_TERMS = [
    "mosquito", "disease", "sewage", "contaminated", "stagnant water",
    "machhar", "ganda paani", "मच्छर", "बीमारी", "गंदा पानी"
]

SENSITIVE_LOCATION_TERMS = [
    "school", "hospital", "junction", "market", "children",
    "school ke paas", "hospital ke paas", "स्कूल", "अस्पताल"
]

DURATION_TERMS = [
    "since", "days", "weeks", "three days", "repeatedly",
    "din se", "hafton se", "दिनों से", "कई दिन"
]

WIDESPREAD_TERMS = [
    "entire", "whole", "all residents", "many people", "whole lane",
    "poori gali", "poora ward", "पूरा", "सभी"
]
```

## Scoring function

```python
from dataclasses import dataclass

@dataclass
class PriorityResult:
    level: str
    score: int
    reasons: list[str]


def contains_any(text: str, terms: list[str]) -> bool:
    normalized = text.lower()
    return any(term.lower() in normalized for term in terms)


def compute_priority(text: str, existing_issue_count: int = 0) -> PriorityResult:
    score = 0
    reasons = []

    if contains_any(text, SAFETY_TERMS):
        score += 45
        reasons.append("Safety hazard detected (+45)")

    if contains_any(text, EMERGENCY_TERMS):
        score += 20
        reasons.append("Urgency phrase detected (+20)")

    if contains_any(text, HEALTH_TERMS):
        score += 20
        reasons.append("Public-health risk detected (+20)")

    if contains_any(text, SENSITIVE_LOCATION_TERMS):
        score += 15
        reasons.append("Sensitive public location mentioned (+15)")

    if contains_any(text, DURATION_TERMS):
        score += 10
        reasons.append("Persistent duration mentioned (+10)")

    if contains_any(text, WIDESPREAD_TERMS):
        score += 10
        reasons.append("Widespread impact mentioned (+10)")

    if existing_issue_count > 0:
        impact_bonus = min(existing_issue_count * 2, 20)
        score += impact_bonus
        reasons.append(f"Existing citizen impact: {existing_issue_count} linked reports (+{impact_bonus})")

    if contains_any(text, ["fire", "electric shock", "gas leak", "collapse", "आग", "करंट"]):
        return PriorityResult("critical", max(score, 71), reasons + ["Emergency override applied"])

    if score >= 71:
        level = "critical"
    elif score >= 46:
        level = "high"
    elif score >= 21:
        level = "medium"
    else:
        level = "low"

    return PriorityResult(level, score, reasons or ["No elevated risk signal detected"])
```

## Priority thresholds

| Score | Priority |
|---:|---|
| 0–20 | low |
| 21–45 | medium |
| 46–70 | high |
| 71+ | critical |

---

# 24. Duplicate Detection Design

## Duplicate decision rule

A duplicate is not merely similar wording. It should represent the same underlying civic event/problem.

```text
High semantic similarity
+ Same category
+ Geographic proximity
+ Active/recent issue
= probable duplicate of that Issue
```

## Exact MVP thresholds

| State | Semantic similarity | Geographic distance | Action |
|---|---:|---:|---|
| Linked duplicate | `>= 0.82` | `<= 500 m` | Auto-link to Issue; officer can undo |
| Possible duplicate | `0.74–0.81` | `<= 750 m` | Show review candidate; normally create new Issue or mark possible |
| No duplicate | `< 0.74` | Any | Create a new Issue |
| Distant same text | Any | `> 1 km` | Treat as separate Issue |

## Haversine distance function

```python
from math import radians, sin, cos, sqrt, atan2

EARTH_RADIUS_M = 6_371_000

def haversine_m(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return EARTH_RADIUS_M * 2 * atan2(sqrt(a), sqrt(1 - a))
```

## Duplicate matcher input

```python
@dataclass
class IssueCandidate:
    id: str
    category: str
    title: str
    embedding: list[float]
    latitude: float | None
    longitude: float | None
    complaint_count: int
    status: str
```

## Duplicate matcher output

```json
{
  "state": "linked",
  "matched_issue_id": "uuid",
  "matched_issue_title": "Missed waste collection near municipal school, Ward 12",
  "semantic_similarity": 0.89,
  "distance_meters": 140,
  "reason": "Same category, highly similar description, and nearby active issue"
}
```

## Matching algorithm

```python
import numpy as np

def match_issue(
    complaint_embedding: list[float],
    category: str,
    latitude: float | None,
    longitude: float | None,
    active_issues: list[IssueCandidate]
) -> dict:
    query = np.array(complaint_embedding)
    best = None

    for issue in active_issues:
        if issue.category != category:
            continue

        similarity = float(np.dot(query, np.array(issue.embedding)))
        distance = haversine_m(latitude, longitude, issue.latitude, issue.longitude)

        if distance is not None and distance > 1000:
            continue

        candidate = {
            "issue": issue,
            "similarity": similarity,
            "distance": distance
        }

        if best is None or candidate["similarity"] > best["similarity"]:
            best = candidate

    if best is None:
        return {"state": "none"}

    sim = best["similarity"]
    distance = best["distance"]

    if sim >= 0.82 and (distance is None or distance <= 500):
        return {
            "state": "linked",
            "matched_issue_id": best["issue"].id,
            "matched_issue_title": best["issue"].title,
            "semantic_similarity": round(sim, 3),
            "distance_meters": round(distance) if distance is not None else None
        }

    if sim >= 0.74 and (distance is None or distance <= 750):
        return {
            "state": "possible",
            "matched_issue_id": best["issue"].id,
            "matched_issue_title": best["issue"].title,
            "semantic_similarity": round(sim, 3),
            "distance_meters": round(distance) if distance is not None else None
        }

    return {"state": "none"}
```

---

# 25. Unified AI Analysis Interface

Person 3 must expose this function to Person 2 no later than the 60-minute mark.

```python
from typing import TypedDict, Optional

class AnalysisResult(TypedDict):
    normalized_text: str
    embedding: list[float]
    category: str
    department_key: str
    confidence: float
    needs_human_review: bool
    priority: str
    priority_score: int
    priority_reasons: list[str]
    duplicate_state: str
    matched_issue_id: Optional[str]
    matched_issue_title: Optional[str]
    semantic_similarity: Optional[float]
    distance_meters: Optional[int]


def analyze_complaint(
    text: str,
    latitude: float | None,
    longitude: float | None,
    active_issues: list[IssueCandidate]
) -> AnalysisResult:
    ...
```

### Required behavior

```text
Input: complaint text, location, active Issue candidates
Output: all fields backend needs to persist and frontend needs to display
No database writes inside analysis function
No HTTP calls required inside analysis function
No LLM/API key dependency
```

---

# 26. Synthetic Data / Ingestion Plan

## Dataset recommendation

Use a controlled synthetic demo dataset informed by real public municipal grievance data structures. OpenCity BBMP grievance resources are public CSV records with fields such as complaint identifier, category, grievance date, ward, and status. [web:7][web:10]

I Change My City public logs additionally demonstrate useful civic complaint schema fields including description, category/subcategory, civic agency, address, latitude, longitude, and status. [web:9][web:13]

## Required seed data

Create:

```text
100 complaints
25 Issues
6 service categories
12 duplicate groups
3 geographic hotspots
5–8 critical complaints
English + Hindi + Hinglish variants
5 low-confidence/manual-review cases
5 same-text but far-away non-duplicates
```

## Three demo hotspots

| Hotspot key | Location theme | Main category | Expected display |
|---|---|---|---|
| `w12_school_waste` | School zone / Ward 12 | Sanitation + Health | Large high-priority hotspot |
| `market_junction_safety` | Market traffic junction | Traffic + Roads | Medium hotspot, some critical/high |
| `residential_water_leak` | Residential water-line corridor | Water | Medium hotspot |

## Required seed Issue examples

```json
[
  {
    "seed_key": "w12_school_waste",
    "title": "Missed waste collection near municipal school, Ward 12",
    "category": "sanitation",
    "priority": "high",
    "status": "open",
    "latitude": 19.0762,
    "longitude": 72.8777,
    "address": "Near municipal school, Ward 12"
  },
  {
    "seed_key": "market_signal_failure",
    "title": "Traffic signal failure at market junction",
    "category": "traffic",
    "priority": "critical",
    "status": "in_progress",
    "latitude": 19.0820,
    "longitude": 72.8840,
    "address": "Main market junction"
  },
  {
    "seed_key": "residential_water_leak",
    "title": "Continuous water pipeline leak in residential lane",
    "category": "water",
    "priority": "high",
    "status": "open",
    "latitude": 19.0700,
    "longitude": 72.8700,
    "address": "Residential Lane 4"
  }
]
```

## Required live demo complaint

```text
“Ward 12 mein school ke paas teen din se kachra nahi uthaya gaya. Mosquitoes are increasing.”

Expected:
- category: sanitation
- priority: high
- duplicate state: linked
- matched issue: Missed waste collection near municipal school, Ward 12
```

## Synthetic generation principles

- Use natural wording; do not produce repetitive templates only.
- Include equivalent language variants within duplicate groups.
- Keep same-location duplicate groups within 100–400 m.
- Keep misleading identical-text non-duplicates more than 1 km away.
- Make critical issues genuinely safety-related.
- Use realistic priority distribution; do not label every issue high/critical.

---

# 27. Seed Script Deliverable

## Script responsibilities

`ingestion/scripts/seed_supabase.py` must:

1. Read `synthetic_complaints.json`.
2. Generate embeddings for all complaint texts.
3. Create/insert Issue records first.
4. Insert linked complaint records.
5. Set expected department, priority, status, coordinates, and issue links.
6. Output a small summary.

## Seed summary output

```text
Seed completed
Departments: 7
Issues: 25
Complaints: 100
Duplicate-linked complaints: 62
Hotspots: 3
Critical Issues: 3
```

The final script should be idempotent where possible, or use a documented `--reset` option.

---

# 28. Optional Clustering Enhancement

## Only after core success

Use DBSCAN for spatial clusters, not semantic clustering, because Issue grouping already provides semantic aggregation.

```python
from sklearn.cluster import DBSCAN
import numpy as np

# approximate conversion: latitude/longitude to local metric-like scaling
coords = np.array([[lat, lon] for lat, lon in coordinates])
clusters = DBSCAN(eps=0.003, min_samples=3).fit_predict(coords)
```

Do not demo DBSCAN as magical AI. It is an optional density detector. The simple geo-grid hotspot model is more predictable in a four-hour build.

---

# 29. AI Evaluation Deliverable

## Minimum test set

Create `expected_labels.json` with 25 manually labeled cases:

```json
{
  "text": "Streetlight is off near the hospital and the road is unsafe at night.",
  "expected_category": "streetlights",
  "expected_priority": "high",
  "expected_duplicate_seed_key": null
}
```

## Compute

- Category accuracy on 25 examples
- Priority agreement on 25 examples
- Duplicate precision/recall on known duplicate pairs/groups
- Median analysis latency over 10 examples

## Presentation wording

Use this precise language:

> “We evaluated the MVP on a manually labeled controlled demonstration set. These numbers validate the workflow and threshold calibration; production performance requires authorized municipal historical data and independent validation.”

Do not claim population-level government accuracy from synthetic data.

---

# 30. AI / Ingestion Definition of Done

The AI/Ingestion layer is done when:

- Model loads once and returns normalized 384-dimensional embeddings
- Classification works on English, Hindi, and Hinglish demo samples
- Priority returns level, score, and human-readable reasons
- Duplicate matcher correctly links the primary demo complaint to the seeded sanitation Issue
- Same text at distant locations is not linked automatically
- Seed dataset creates 100 records, 25 Issues, and three visual hotspots
- A JSON evaluation result is produced
- Backend can call `analyze_complaint()` without knowing model internals

---

# 31. Cross-Team Integration Timeline

## Minute 0–15: Mandatory alignment

| Person | Required output |
|---|---|
| Frontend | Page list, visual shell, mock response types |
| Backend | Endpoint list and payload contract |
| AI/Ingestion | Category keys, analysis-result structure, seed demo text |

No coding should proceed before everyone agrees on:

```text
- Field names
- Priority/status enum strings
- Category keys
- Submit complaint request/response JSON
- Primary live demo complaint
```

## Minute 15–45: Parallel foundation

| Person | Task |
|---|---|
| Person 1 | Citizen form, dashboard mock, authority dashboard mock |
| Person 2 | Supabase schema, FastAPI health endpoint, basic complaint route |
| Person 3 | Embedding service, templates, classification, priority rules, seed JSON |

## Minute 45–75: First integration

| Person | Task |
|---|---|
| Person 1 | Connect citizen submit form to API; maintain mock fallback |
| Person 2 | Call analysis service and persist complaint/issue |
| Person 3 | Deliver `analyze_complaint`; test expected demo duplicate |

**Milestone:** A citizen can submit a complaint and receive classification, priority, and Issue link/create result.

## Minute 75–120: Authority workflow

| Person | Task |
|---|---|
| Person 1 | Authority issue queue + issue detail + status controls |
| Person 2 | Issue list/detail/update/resolve APIs; RBAC guard |
| Person 3 | Seed database; verify counts/hotspot coordinates; tune thresholds |

**Milestone:** Officer sees a linked Issue and changes its status.

## Minute 120–155: Map and KPIs

| Person | Task |
|---|---|
| Person 1 | Leaflet map, markers, hotspot circles, KPI cards |
| Person 2 | Analytics and map endpoints |
| Person 3 | Geo-grid hotspot output and test cases |

**Milestone:** Dashboard map displays 3 obvious hotspots and issue counts.

## Minute 155–195: Hardening

| Person | Task |
|---|---|
| Person 1 | Loading/error states, responsive layout, badge polish |
| Person 2 | Auth scope tests, endpoint errors, CORS |
| Person 3 | Evaluation JSON, model/threshold explanation, demo inputs |

## Minute 195–240: Deploy and rehearse

| Person | Task |
|---|---|
| Person 1 | Deploy frontend and verify API environment variable |
| Person 2 | Deploy backend and verify health/docs |
| Person 3 | Seed deployed database, prepare demo dataset and backup screenshots |
| All | Run exact three-minute demo twice |

---

# 32. Integration Test Checklist

## Citizen flow

- [ ] Citizen logs in or enters demo citizen mode
- [ ] Citizen enters complaint text and coordinates
- [ ] Form rejects empty/short text
- [ ] Complaint submission returns a result
- [ ] Result shows department, priority, reasons, duplicate state
- [ ] Complaint appears in citizen history
- [ ] Complaint links to visible Issue summary

## Authority flow

- [ ] Officer dashboard shows department-scoped issue queue
- [ ] High/critical Issue appears at top
- [ ] Issue shows linked complaint count
- [ ] Officer opens Issue detail
- [ ] Officer changes Issue status to In Progress
- [ ] Officer resolves Issue
- [ ] Citizen complaint reflects updated/resolved state

## Duplicate flow

- [ ] English sanitation complaint creates/links expected Issue
- [ ] Hindi/Hinglish paraphrase links same nearby Issue
- [ ] Same wording far away creates another Issue
- [ ] Borderline match is labeled possible or sent to review

## GIS flow

- [ ] Map loads
- [ ] Issue markers appear
- [ ] At least 3 hotspot circles appear
- [ ] Hotspot count is understandable
- [ ] Priority/status/category filters work if implemented

---

# 33. Final 3-Minute Demo Script

## 0:00–0:30 — Citizen reports an issue

> “A citizen reports in Hinglish that garbage has not been collected near a school for three days and mosquitoes are increasing.”

Enter:

```text
Ward 12 mein school ke paas teen din se kachra nahi uthaya gaya. Mosquitoes are increasing.
```

Select the pre-seeded Ward 12 location.

## 0:30–1:00 — AI understands and groups it

Show:

- Department: Solid Waste & Sanitation
- Priority: High
- Explainability: public-health risk, school/sensitive location, persistent duration
- Duplicate: similar active Issue within 140 m
- Underlying Issue link and increased linked-report count

> “Instead of creating another disconnected ticket, CivicIssue AI links this report to the real issue authorities need to solve.”

## 1:00–1:50 — Authority sees impact

Open Authority Dashboard.

Show:

- High priority issue queue
- Issue with linked report count now increased
- Ward 12 hotspot circle
- Map popup with sanitation category and open count

> “The dashboard prioritizes operational impact, not just ticket volume.”

## 1:50–2:30 — Officer acts at issue level

Open Issue Detail.

- Change to `In Progress`
- Optionally assign to officer
- Show linked complaint list and status timeline

## 2:30–3:00 — Citizen receives transparency

Return to citizen complaint page.

Show updated Issue/complaint status.

> “One issue-level field action updates every linked citizen report, reducing duplicate workload while improving transparency.”

---

# 34. Survival Plan

## If only two hours remain

Complete only this chain:

```text
Submit Complaint
→ Analyze category/priority
→ Match/Create Issue
→ Authority Issue Queue
→ Update status
→ Citizen sees updated status
```

Use static coordinates and omit map if required.

## If model download fails

1. Try model cache / teammate machine.
2. Use backend-hosted or API embedding only if key already exists.
3. Use keyword fallback only to retain a working flow.
4. Keep the UI wording honest: “Fallback classification mode.”

## If database setup fails

Use SQLite or JSON file persistence locally for the demo. Preserve entity IDs, Complaint → Issue links, and status update workflow.

## If auth fails

Use local demo personas temporarily. Keep the RBAC logic represented through a visible role selector and backend development headers.

## If GIS fails

Replace map with hotspot cards:

```text
Ward 12 School Area — 13 linked reports — HIGH
Market Junction — 7 linked reports — CRITICAL
Residential Lane 4 — 6 linked reports — HIGH
```

## If duplicate matching seems weak

Use strongly semantically aligned seeded duplicates in the live demo, retain geo gating, and describe it as a confidence-guided decision with human override.

---

# 35. Final Build Order

```text
1. Freeze API + data contracts
2. Create database schema and seed departments
3. Build `analyze_complaint()`
4. Build POST /complaints → link/create Issue
5. Build citizen submit/result page
6. Build authority Issue queue + update endpoint
7. Build citizen status tracking
8. Add seeded duplicate groups
9. Add map and hotspot circles
10. Add KPIs, polish, deployment, rehearsal
```

# 36. Final Success Criteria

Your MVP is ready when a judge can see, live and end-to-end:

1. A multilingual civic complaint being submitted.
2. AI category classification and routing.
3. Explainable priority assignment.
4. Semantic and location-aware duplicate detection.
5. Multiple complaints represented as one underlying civic Issue.
6. A department officer operating an issue-level queue.
7. A GIS hotspot revealing civic impact.
8. A status update reaching the citizen view.

This is the smallest credible implementation that fully demonstrates SIH26S02 without sacrificing the central innovation: **authorities resolve underlying civic issues, not isolated duplicate tickets.**
