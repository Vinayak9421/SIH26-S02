# SIH26S02 — Revised Database Schema and Seed Data Plan

## Roles: User, Department Admin, Super Admin

> **Revision objective:** Remove the Officer role completely. The system has exactly three application roles:
>
> 1. **User** — citizen who defines their own profile and submits/tracks grievances
> 2. **Department Admin** — department-level authority who manages Issues and all complaints routed to their department
> 3. **Super Admin** — system-level administrator who manages departments, department admins, and global analytics
>
> **Core operating model:** Citizens create **Complaints**. AI classifies and links each Complaint to an **Underlying Civic Issue**. Department Admins act on Issues. One resolved Issue can update all linked citizen complaints.

---

# 1. Final Product Model

```text
User (Citizen)
  └── creates many Complaints
          └── each Complaint belongs to one Underlying Issue
                  └── each Issue belongs to one Department
                          └── each Department has one or more Department Admins

Super Admin
  └── manages all Departments, Department Admins, and global settings
```

## Why there is no Officer role

For a four-hour MVP, Officer assignment adds tables, states, pages, permissions, and workflow complexity without improving the primary SIH demo.

The **Department Admin** is the operational owner for their department. They can view, prioritize, update, and resolve Issues in that department. In production, a later `officer` or `field_worker` role can be added below Department Admin without changing the Complaint → Issue model.

---

# 2. Roles and Permissions

## 2.1 Role definitions

### User

A citizen/end user who defines their own profile during registration and submits civic grievances.

Can:

- Register and log in
- Create and edit their profile
- Submit complaints
- View only their own complaints
- View the status/timeline of their own complaints
- View a privacy-safe summary of the linked Issue
- Add additional comments/evidence to their own open complaint, optional

Cannot:

- View another user’s complaint text or identity
- View department queues
- Change routing, priority, duplicate relationship, or status
- Access analytics or department maps

### Department Admin

An authority user responsible for exactly one department in the MVP.

Can:

- View all Issues and Complaints routed to their department
- View issue-level complaint impact and map/hotspots for their department
- Update Issue status: `open → in_progress → resolved`
- Override AI category/department, priority, and duplicate links
- Merge/split issues, optional
- View department-scoped analytics
- Add status notes visible to linked users where appropriate

Cannot:

- Access other departments’ operational data
- Create or delete other departments
- Assign/revoke Super Admins
- View global analytics

### Super Admin

System-level administrator.

Can:

- View all departments, complaints, issues, hotspots, and analytics
- Create/update/deactivate departments
- Create/activate/deactivate Department Admin profiles
- Change a Department Admin’s department assignment
- View audit logs
- Override any Issue routing, priority, duplicate relationship, status, or department
- Configure category templates and escalation settings, optional

Cannot / should not:

- View more personal user data than operationally necessary
- Change citizen-submitted complaint text without preserving original text/audit history

---

## 2.2 Permission matrix

| Capability | User | Department Admin | Super Admin |
|---|---:|---:|---:|
| Register / define profile | Yes | Provisioned / invite only | Provisioned only |
| Log in | Yes | Yes | Yes |
| Edit own profile | Yes | Yes | Yes |
| Submit complaint | Yes | Optional | Optional |
| View own complaints | Yes | Yes (only if submitted personally) | Yes (only if submitted personally) |
| View all department complaints | No | Own department only | All departments |
| View Issues | Linked Issue summary only | Own department only | All departments |
| View complaint details | Own only | Own department only | All |
| View citizen identity | Own identity only | Own department only, minimum needed | All, minimum needed |
| Update complaint status | No | Via Issue resolution/status sync | Yes |
| Update Issue status | No | Own department only | All |
| Override classification/routing | No | Own department only | All |
| Override priority | No | Own department only | All |
| Confirm/unlink duplicate | No | Own department only | All |
| View map/hotspots | No | Own department only | All |
| View analytics | Personal complaint summary only | Own department only | All |
| Manage departments | No | No | Yes |
| Manage Department Admins | No | No | Yes |
| View audit logs | No | Own department actions only, optional | All |

---

# 3. User-Defined Profile Design

## 3.1 Registration rule

Every citizen creates their own profile during registration. The application stores account/authentication separately from profile information.

```text
Supabase Auth user
        ↓
profiles row
        ↓
user_profile_details row (optional but recommended)
```

This separation keeps authentication fields managed by Supabase while allowing the application to collect user-defined data safely.

## 3.2 User profile fields

### Required at registration

| Field | Type | Notes |
|---|---|---|
| full_name | text | Citizen-provided display name |
| email | text | Managed through Supabase Auth |
| mobile_number | text, optional for MVP | Validate if collected; do not require unless SMS exists |
| preferred_language | text | `en`, `hi`, `hinglish`, etc. |
| city | text | Citizen-provided city/locality |
| locality_or_ward | text, optional | Helps contextualize submissions |

### Optional profile preferences

| Field | Type | Purpose |
|---|---|---|
| profile_photo_url | text | Avoid in MVP unless storage is ready |
| notification_email | boolean | Default true/false depending on notification support |
| notification_in_app | boolean | Default true |
| default_latitude | double precision | Optional saved area, do not assume home location |
| default_longitude | double precision | Optional saved area, do not assume home location |
| accessibility_notes | text | Optional; do not expose broadly |

### Privacy rules

- Do not show full citizen contact details on public maps or dashboards.
- Department Admins see only what is required to process a complaint.
- Do not expose user profile coordinates as an assumed home address.
- Store a user’s submitted complaint location separately from their profile.
- Never store Aadhaar, PAN, bank details, or other unnecessary identity documents.

---

# 4. Core Relationship Model

## 4.1 Entity relationship diagram

```text
                         ┌────────────────────┐
                         │    auth.users      │
                         │ Supabase managed   │
                         └─────────┬──────────┘
                                   │ 1:1
                                   ▼
                         ┌────────────────────┐
                         │      profiles      │
                         │ role + basic data  │
                         └──────┬───────┬─────┘
                                │       │
                        1:1     │       │ M:1 (only department admins)
                                │       ▼
                                │  ┌────────────────────┐
                                │  │    departments     │
                                │  └─────────┬──────────┘
                                │            │ 1:M
                                ▼            ▼
                    ┌────────────────┐  ┌────────────────┐
                    │ user_profiles  │  │     issues     │
                    │ preferences    │  │ civic problem  │
                    └────────────────┘  └───────┬────────┘
                                                │ 1:M
                                                ▼
                                        ┌────────────────┐
                                        │   complaints   │
                                        │ citizen report │
                                        └───────┬────────┘
                                                │ 1:M
                                                ▼
                                  ┌─────────────────────────┐
                                  │ complaint_status_history │
                                  └─────────────────────────┘

issues (1:M) → issue_status_history
profiles (1:M) → audit_logs
```

## 4.2 Cardinality rules

| Relationship | Cardinality | Rule |
|---|---:|---|
| auth user → profile | 1:1 | Every signed-in application user has one profile |
| profile → user_profile_details | 1:1 | Optional extended citizen-defined preferences/details |
| User profile → Complaint | 1:M | A user can submit many complaints |
| Complaint → Issue | M:1 | Every complaint is linked to one civic Issue after processing |
| Department → Issue | 1:M | Every Issue is owned by one department |
| Department → Department Admin profile | 1:M | A department can have one or more admins |
| Department Admin → Department | M:1 | MVP: each admin belongs to exactly one department |
| Issue → complaint status/history | 1:M through complaints | Issue lifecycle affects linked reports |
| Profile → audit log | 1:M | Admin activity is auditable |

---

# 5. Final Database Schema

## 5.1 Database decision

Use **Supabase PostgreSQL** with:

- Supabase Auth for account creation and JWTs
- `profiles` for application roles
- PostgreSQL tables for complaints/issues
- `pgvector` for semantic embeddings where available
- FastAPI backend as the only trusted authority for high-impact writes and AI decisions

The selected multilingual model creates 384-dimensional sentence vectors, so use `vector(384)` if pgvector is enabled. [page:45]

---

## 5.2 Role enum

```sql
create type public.app_role as enum (
  'user',
  'department_admin',
  'super_admin'
);
```

## 5.3 Status enums

```sql
create type public.complaint_status as enum (
  'pending',
  'in_progress',
  'resolved',
  'rejected'
);

create type public.issue_status as enum (
  'open',
  'in_progress',
  'resolved'
);

create type public.priority_level as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.duplicate_state as enum (
  'none',
  'possible',
  'linked'
);
```

---

## 5.4 Departments table

A department owns and resolves Issues. A Department Admin is attached to one department.

```sql
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category_key text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Seeded departments

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

## 5.5 Profiles table

Every authenticated account gets one profile. The `role` controls application access.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role public.app_role not null default 'user',
  department_id uuid references public.departments(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint department_admin_requires_department check (
    (role = 'department_admin' and department_id is not null)
    or (role <> 'department_admin')
  ),

  constraint normal_user_has_no_department check (
    (role <> 'user') or department_id is null
  )
);
```

### Profile relationship rule

```text
role = user
  → department_id must be null

role = department_admin
  → department_id must be non-null

role = super_admin
  → department_id may be null; global scope is determined by role
```

---

## 5.6 User profile details table

This table stores citizen-defined details and notification preferences. Keep it separate from operational complaint data.

```sql
create table public.user_profile_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  mobile_number text,
  preferred_language text not null default 'en',
  city text,
  locality_or_ward text,
  notification_in_app boolean not null default true,
  notification_email boolean not null default false,
  default_latitude double precision,
  default_longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_default_latitude check (
    default_latitude is null or default_latitude between -90 and 90
  ),
  constraint valid_default_longitude check (
    default_longitude is null or default_longitude between -180 and 180
  )
);
```

> Department Admins and Super Admins may have a `profiles` row without `user_profile_details`. If they use citizen functions, they may also create their own profile-details row.

---

## 5.7 Issues table

An Issue is the real-world civic problem that Department Admins manage.

```sql
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id),

  title text not null,
  summary text,
  category text not null,

  representative_embedding vector(384),

  priority public.priority_level not null default 'medium',
  priority_score integer not null default 0 check (priority_score between 0 and 100),
  priority_reasons jsonb not null default '[]'::jsonb,

  complaint_count integer not null default 0 check (complaint_count >= 0),
  status public.issue_status not null default 'open',

  latitude double precision,
  longitude double precision,
  address text,
  hotspot_key text,

  ai_confidence numeric,
  needs_human_review boolean not null default false,

  created_by uuid references public.profiles(id) on delete set null,
  last_updated_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,

  constraint issue_valid_latitude check (latitude is null or latitude between -90 and 90),
  constraint issue_valid_longitude check (longitude is null or longitude between -180 and 180)
);
```

### Important design decision

There is **no `assigned_officer_id`**. Department Admins are the operational authority in the MVP. The `last_updated_by` field gives accountability without creating an Officer/assignment workflow.

---

## 5.8 Complaints table

A Complaint belongs to the user who submitted it and links to one Issue after AI processing.

```sql
create table public.complaints (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.profiles(id) on delete restrict,
  issue_id uuid references public.issues(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,

  text text not null check (char_length(trim(text)) >= 10),
  normalized_text text,
  language_hint text,

  embedding vector(384),
  ai_category text,
  ai_confidence numeric,

  priority public.priority_level not null default 'medium',
  priority_score integer not null default 0 check (priority_score between 0 and 100),
  priority_reasons jsonb not null default '[]'::jsonb,

  duplicate_state public.duplicate_state not null default 'none',
  duplicate_of_issue_id uuid references public.issues(id) on delete set null,

  status public.complaint_status not null default 'pending',

  latitude double precision,
  longitude double precision,
  address text,

  citizen_visible_note text,
  internal_admin_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint complaint_valid_latitude check (latitude is null or latitude between -90 and 90),
  constraint complaint_valid_longitude check (longitude is null or longitude between -180 and 180)
);
```

### Complaint rules

```text
- user_id is always the citizen/user who submitted the report.
- issue_id is null only during a temporary AI/database failure or before processing completes.
- department_id is the AI-selected/administrator-confirmed routing department.
- duplicate_of_issue_id is set for `linked` or `possible` duplicate states.
- users never directly edit department_id, issue_id, priority, or duplicate state.
```

---

## 5.9 Complaint status history

```sql
create table public.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  status public.complaint_status not null,
  note text,
  visibility text not null default 'user'
    check (visibility in ('user', 'department_admin', 'super_admin')),
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
```

### Visibility rules

- `user`: visible to the complaint owner and relevant admins
- `department_admin`: internal department note
- `super_admin`: confidential platform-level note

---

## 5.10 Issue status history

```sql
create table public.issue_status_history (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  status public.issue_status not null,
  note text,
  visibility text not null default 'user'
    check (visibility in ('user', 'department_admin', 'super_admin')),
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
```

---

## 5.11 Audit logs

Audit all authority-level modifications.

```sql
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null check (entity_type in ('profile', 'department', 'complaint', 'issue')),
  entity_id uuid not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
```

### Mandatory audit events

```text
issue_status_changed
issue_priority_overridden
complaint_reclassified
duplicate_confirmed
duplicate_unlinked
issue_merged
issue_split
department_admin_created
department_admin_department_changed
department_created
department_deactivated
```

---

# 6. Indexes and Database Functions

## 6.1 Required indexes

```sql
create index profiles_role_department_idx
on public.profiles (role, department_id);

create index issues_department_status_priority_idx
on public.issues (department_id, status, priority_score desc, updated_at desc);

create index issues_hotspot_idx
on public.issues (hotspot_key)
where status <> 'resolved';

create index complaints_user_created_idx
on public.complaints (user_id, created_at desc);

create index complaints_issue_idx
on public.complaints (issue_id);

create index complaints_department_status_idx
on public.complaints (department_id, status, priority, created_at desc);

create index complaint_history_complaint_idx
on public.complaint_status_history (complaint_id, created_at asc);

create index issue_history_issue_idx
on public.issue_status_history (issue_id, created_at asc);
```

## 6.2 Optional pgvector index

Create this only after initial seed data works.

```sql
create index issues_embedding_cosine_idx
on public.issues
using ivfflat (representative_embedding vector_cosine_ops)
with (lists = 10);
```

For a 100-complaint demo dataset, retrieving active issue vectors into FastAPI and calculating cosine similarity in Python is an acceptable fallback.

## 6.3 Update timestamp trigger

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger departments_updated_at
before update on public.departments
for each row execute function public.set_updated_at();

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_profile_details_updated_at
before update on public.user_profile_details
for each row execute function public.set_updated_at();

create trigger issues_updated_at
before update on public.issues
for each row execute function public.set_updated_at();

create trigger complaints_updated_at
before update on public.complaints
for each row execute function public.set_updated_at();
```

---

# 7. Row-Level Security Plan

## 7.1 RLS principle

Use FastAPI as the primary authorization layer. Enable RLS in Supabase as defense in depth.

```sql
alter table public.profiles enable row level security;
alter table public.user_profile_details enable row level security;
alter table public.complaints enable row level security;
alter table public.issues enable row level security;
alter table public.complaint_status_history enable row level security;
alter table public.issue_status_history enable row level security;
alter table public.audit_logs enable row level security;
```

## 7.2 Helper function

```sql
create or replace function public.current_role()
returns public.app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_department_id()
returns uuid
language sql
stable
as $$
  select department_id from public.profiles where id = auth.uid()
$$;
```

## 7.3 Essential policies (conceptual)

### User can view own complaints

```sql
create policy "users read own complaints"
on public.complaints
for select
using (
  user_id = auth.uid()
  or public.current_role() = 'super_admin'
  or (
    public.current_role() = 'department_admin'
    and department_id = public.current_department_id()
  )
);
```

### User can create own complaints

```sql
create policy "users create own complaints"
on public.complaints
for insert
with check (
  user_id = auth.uid()
  and public.current_role() = 'user'
);
```

### Department Admin sees own department Issues

```sql
create policy "department admins read scoped issues"
on public.issues
for select
using (
  public.current_role() = 'super_admin'
  or (
    public.current_role() = 'department_admin'
    and department_id = public.current_department_id()
  )
);
```

### Important note

For the actual MVP, FastAPI should use a service-role database connection for controlled writes, while the public frontend should not get permission to directly modify Issue, routing, priority, duplicate, or status records.

---

# 8. Workflow Without Officers

## 8.1 Complaint submission workflow

```text
User registers and defines profile
        ↓
User submits Complaint text + location
        ↓
AI normalizes/embeds text
        ↓
AI predicts category and department
        ↓
Priority rules produce level + reasons
        ↓
Semantic + geo matcher checks active Issues
        ↓
Match found?
  ├── Yes → Complaint links to existing Issue
  └── No  → System creates a new Issue
        ↓
Department Admin sees routed Issue in department dashboard
        ↓
Department Admin verifies/overrides AI decision if required
        ↓
Department Admin updates Issue status
        ↓
Linked Complaint statuses update for all affected Users
```

## 8.2 Department Admin workflow

```text
Department Admin logs in
        ↓
Views own department dashboard
        ↓
Sorts Issues by priority, linked complaint count, and date
        ↓
Opens an Issue
        ↓
Reads linked complaint summaries and AI reasons
        ↓
Updates Issue: Open → In Progress → Resolved
        ↓
System synchronizes status to all linked complaints
        ↓
Users see updated timeline
```

## 8.3 Super Admin workflow

```text
Super Admin logs in
        ↓
Views global KPI dashboard and all department hotspots
        ↓
Creates/activates department and Department Admin account
        ↓
Reviews low-confidence/review-flagged Issues
        ↓
Audits overrides and department performance
```

---

# 9. API Design Updated for Three Roles

Base URL:

```text
/api/v1
```

Authentication:

```text
Authorization: Bearer <Supabase JWT>
```

## 9.1 Profile APIs

| Method | Route | Role | Purpose |
|---|---|---|---|
| GET | `/me` | Any authenticated | Return profile and role |
| PATCH | `/me` | Any authenticated | Update own profile basic fields |
| GET | `/me/profile-details` | User | Get own preferences/details |
| PUT | `/me/profile-details` | User | Create/update own city, language, locality, notification settings |

### User profile update request

```json
{
  "full_name": "Mihir Mehta",
  "preferred_language": "en",
  "city": "Mumbai",
  "locality_or_ward": "Ward 12",
  "notification_in_app": true,
  "notification_email": false
}
```

## 9.2 Complaint APIs

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/complaints` | User | Submit complaint and invoke AI pipeline |
| GET | `/complaints/mine` | User | Own complaint history |
| GET | `/complaints/{complaint_id}` | Owner / scoped admin | Complaint detail and timeline |
| GET | `/complaints` | Department Admin / Super Admin | Scoped operational complaint list |
| POST | `/complaints/{complaint_id}/comment` | Owner / scoped admin | Optional follow-up/comment |

## 9.3 Issue APIs

| Method | Route | Role | Purpose |
|---|---|---|---|
| GET | `/issues` | Department Admin / Super Admin | Department/global issue queue |
| GET | `/issues/{issue_id}` | Linked User / scoped admin | Detail; users receive safe summary only |
| PATCH | `/issues/{issue_id}` | Department Admin / Super Admin | Update status, priority, visible note |
| POST | `/issues/{issue_id}/resolve` | Department Admin / Super Admin | Resolve Issue + sync linked complaints |
| POST | `/issues/{issue_id}/reclassify` | Department Admin / Super Admin | Override department/category |
| POST | `/issues/{issue_id}/merge` | Department Admin / Super Admin | Optional issue merge |
| POST | `/complaints/{complaint_id}/unlink-issue` | Department Admin / Super Admin | Optional duplicate correction |

## 9.4 Department management APIs

| Method | Route | Role | Purpose |
|---|---|---|---|
| GET | `/departments` | Any authenticated | List active departments |
| POST | `/departments` | Super Admin | Create department |
| PATCH | `/departments/{department_id}` | Super Admin | Update/deactivate department |
| GET | `/admin/department-admins` | Super Admin | List Department Admins |
| POST | `/admin/department-admins` | Super Admin | Provision Department Admin |
| PATCH | `/admin/department-admins/{profile_id}` | Super Admin | Activate/deactivate/change department |

## 9.5 Analytics and GIS APIs

| Method | Route | Role | Purpose |
|---|---|---|---|
| GET | `/analytics/summary` | Department Admin / Super Admin | Scoped KPI summary |
| GET | `/analytics/by-category` | Department Admin / Super Admin | Scoped category counts |
| GET | `/analytics/by-priority` | Department Admin / Super Admin | Scoped priority counts |
| GET | `/map/issues` | Department Admin / Super Admin | Scoped map marker data |
| GET | `/map/hotspots` | Department Admin / Super Admin | Scoped hotspot aggregates |
| GET | `/admin/audit-logs` | Super Admin | Global audit logs |

---

# 10. Critical Endpoint Behavior

## 10.1 `POST /complaints`

Only a `user` can submit a regular citizen complaint in the MVP.

### Request

```json
{
  "text": "Ward 12 mein school ke paas teen din se kachra nahi uthaya gaya. Mosquitoes are increasing.",
  "address": "Near Municipal School, Ward 12",
  "latitude": 19.0762,
  "longitude": 72.8777
}
```

### Processing sequence

```text
1. Read current authenticated User profile.
2. Validate text, length, coordinate ranges.
3. Generate multilingual embedding.
4. Classify category and target department.
5. Calculate explainable priority.
6. Search active Issues only in predicted department/category.
7. Check semantic similarity and geographic proximity.
8. Link to existing Issue or create a new Issue.
9. Insert Complaint owned by current User.
10. Add Complaint status history: pending.
11. Return user-friendly AI result.
```

### Response

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
      "Public-health risk detected (+20)",
      "Sensitive public location mentioned (+15)",
      "Persistent duration mentioned (+10)"
    ]
  },
  "duplicate": {
    "state": "linked",
    "matched_issue_title": "Missed waste collection near municipal school, Ward 12",
    "semantic_similarity": 0.89,
    "distance_meters": 140
  },
  "status": "pending"
}
```

## 10.2 `PATCH /issues/{issue_id}`

Department Admin may modify only Issues in their own department.

### Request

```json
{
  "status": "in_progress",
  "priority": "high",
  "citizen_visible_note": "The sanitation team has been notified and the issue is under action.",
  "internal_admin_note": "Verify waste vehicle route for Ward 12.",
  "reason": "Field response initiated"
}
```

### Required backend behavior

```text
- Verify Department Admin is assigned to Issue department.
- Save prior data for audit.
- Update Issue status/priority.
- Add Issue status history.
- Synchronize linked unresolved complaint statuses:
    Issue open        → complaint pending
    Issue in_progress → complaint in_progress
    Issue resolved    → complaint resolved
- Create audit log.
```

## 10.3 `POST /issues/{issue_id}/resolve`

```text
Department Admin resolves one underlying Issue.
System marks linked pending/in-progress Complaints as resolved.
Every linked User sees the updated citizen-visible note and timeline.
```

---

# 11. Revised Seed Data Plan

## 11.1 Seed data goals

The seed data must demonstrate:

- User-defined profiles
- Department Admin department ownership
- Super Admin global visibility
- Complaint ownership by a User
- Multiple Complaints linked to an Issue
- AI classification/priority fields
- Duplicate detection labels
- Three GIS hotspots
- Issue-level status updates without Officers

## 11.2 Exact seed counts

| Entity | Count | Notes |
|---|---:|---|
| Departments | 7 | Six civic + General Review |
| Profiles / users | 12 | 1 Super Admin, 7 Department Admins, 4 citizen Users |
| User profile details | 4–12 | All citizens; optional admin rows |
| Issues | 25 | Underlying civic problems |
| Complaints | 100 | Citizen-submitted reports |
| Complaint histories | 100+ | At least initial status per complaint |
| Issue histories | 25+ | At least initial status per issue |
| Audit logs | 15–25 | Admin action examples |
| Test cases | 25 | Separate AI testing input |
| Demo submissions | 5 | Presentation input |

---

# 12. Seed Users and Profiles

## File: `dataset/profiles.json`

Use `seed_key` rather than forcing static UUIDs into Supabase Auth. The seed script maps `seed_key` to actual Supabase/Auth UUIDs.

```json
[
  {
    "seed_key": "profile-super-admin",
    "full_name": "System Administrator",
    "email": "admin@civicissue.demo",
    "role": "super_admin",
    "department_seed_key": null,
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-admin-sanitation",
    "full_name": "Asha Rao",
    "email": "sanitation.admin@civicissue.demo",
    "role": "department_admin",
    "department_seed_key": "dept-sanitation",
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-admin-water",
    "full_name": "Rahul Shah",
    "email": "water.admin@civicissue.demo",
    "role": "department_admin",
    "department_seed_key": "dept-water",
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-admin-roads",
    "full_name": "Neha Kulkarni",
    "email": "roads.admin@civicissue.demo",
    "role": "department_admin",
    "department_seed_key": "dept-roads",
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-admin-streetlights",
    "full_name": "Vikram Iyer",
    "email": "streetlights.admin@civicissue.demo",
    "role": "department_admin",
    "department_seed_key": "dept-streetlights",
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-admin-health",
    "full_name": "Farah Khan",
    "email": "health.admin@civicissue.demo",
    "role": "department_admin",
    "department_seed_key": "dept-health",
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-admin-traffic",
    "full_name": "Arjun Menon",
    "email": "traffic.admin@civicissue.demo",
    "role": "department_admin",
    "department_seed_key": "dept-traffic",
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-admin-general-review",
    "full_name": "Review Queue Administrator",
    "email": "review.admin@civicissue.demo",
    "role": "department_admin",
    "department_seed_key": "dept-general-review",
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-user-1",
    "full_name": "Citizen One",
    "email": "citizen1@civicissue.demo",
    "role": "user",
    "department_seed_key": null,
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-user-2",
    "full_name": "Citizen Two",
    "email": "citizen2@civicissue.demo",
    "role": "user",
    "department_seed_key": null,
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-user-3",
    "full_name": "Citizen Three",
    "email": "citizen3@civicissue.demo",
    "role": "user",
    "department_seed_key": null,
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "seed_key": "profile-user-4",
    "full_name": "Citizen Four",
    "email": "citizen4@civicissue.demo",
    "role": "user",
    "department_seed_key": null,
    "is_active": true,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  }
]
```

---

# 13. Seed User Profile Details

## File: `dataset/user_profile_details.json`

Seed profile details for the four citizen Users. Do not include fake phone numbers unless the UI requires it.

```json
[
  {
    "profile_seed_key": "profile-user-1",
    "preferred_language": "en",
    "city": "Demo City",
    "locality_or_ward": "Ward 12",
    "notification_in_app": true,
    "notification_email": false,
    "default_latitude": 19.0762,
    "default_longitude": 72.8777,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "profile_seed_key": "profile-user-2",
    "preferred_language": "hinglish",
    "city": "Demo City",
    "locality_or_ward": "Ward 6",
    "notification_in_app": true,
    "notification_email": false,
    "default_latitude": 19.0700,
    "default_longitude": 72.8700,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "profile_seed_key": "profile-user-3",
    "preferred_language": "hi",
    "city": "Demo City",
    "locality_or_ward": "Ward 12",
    "notification_in_app": true,
    "notification_email": false,
    "default_latitude": 19.0764,
    "default_longitude": 72.8780,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  },
  {
    "profile_seed_key": "profile-user-4",
    "preferred_language": "en",
    "city": "Demo City",
    "locality_or_ward": "Ward 17",
    "notification_in_app": true,
    "notification_email": false,
    "default_latitude": 19.0950,
    "default_longitude": 72.9050,
    "is_synthetic": true,
    "source": "synthetic_demo_data"
  }
]
```

---

# 14. Revised Issue Seed Format

## File: `dataset/issues.json`

### Required fields

```json
{
  "seed_key": "w12_school_waste",
  "title": "Missed waste collection near municipal school, Ward 12",
  "summary": "Garbage has accumulated near the municipal school entrance for multiple days, creating odor and mosquito concerns.",
  "department_seed_key": "dept-sanitation",
  "category": "sanitation",
  "priority": "high",
  "priority_score": 55,
  "priority_reasons": [
    "Public-health risk detected (+20)",
    "Sensitive public location mentioned (+15)",
    "Persistent duration mentioned (+10)"
  ],
  "status": "open",
  "latitude": 19.0762,
  "longitude": 72.8777,
  "address": "Near Municipal School, Ward 12",
  "hotspot_key": "w12_school_waste",
  "expected_complaint_count": 14,
  "needs_human_review": false,
  "created_by_profile_seed_key": "profile-user-1",
  "last_updated_by_profile_seed_key": "profile-admin-sanitation",
  "created_at": "2026-08-25T08:15:00Z",
  "updated_at": "2026-09-01T07:30:00Z",
  "resolved_at": null,
  "is_synthetic": true,
  "source": "synthetic_demo_data"
}
```

### Important issue seeding rules

- `department_seed_key` must map to a department.
- `last_updated_by_profile_seed_key` must be either the matching Department Admin or Super Admin.
- Never reference an Officer because that role does not exist.
- `expected_complaint_count` must equal the final number of complaints referencing the issue.
- For resolved Issues, set `resolved_at`; for open/in_progress, set it to null.

---

# 15. Revised Complaint Seed Format

## File: `dataset/complaints.json`

### Required fields

```json
{
  "seed_key": "cmp-001",
  "user_profile_seed_key": "profile-user-1",
  "issue_seed_key": "w12_school_waste",
  "department_seed_key": "dept-sanitation",
  "text": "Garbage has not been collected near the municipal school for three days. The smell is getting worse and mosquitoes are increasing.",
  "normalized_text": "garbage has not been collected near the municipal school for three days. the smell is getting worse and mosquitoes are increasing.",
  "language_hint": "en",
  "expected_category": "sanitation",
  "ai_confidence": 0.88,
  "priority": "high",
  "priority_score": 55,
  "priority_reasons": [
    "Public-health risk detected (+20)",
    "Sensitive public location mentioned (+15)",
    "Persistent duration mentioned (+10)"
  ],
  "duplicate_state": "linked",
  "duplicate_of_issue_seed_key": "w12_school_waste",
  "status": "pending",
  "latitude": 19.0764,
  "longitude": 72.8781,
  "address": "Near Municipal School, Ward 12",
  "citizen_visible_note": "Your report has been grouped with an active sanitation issue nearby.",
  "internal_admin_note": null,
  "created_at": "2026-08-28T09:15:00Z",
  "updated_at": "2026-08-28T09:15:00Z",
  "is_synthetic": true,
  "source": "synthetic_demo_data"
}
```

### Complaint ownership rules

```text
- user_profile_seed_key must always reference a profile with role = user.
- A department_admin must never be the seed owner of normal citizen complaints.
- issue_seed_key must reference an existing Issue.
- department_seed_key must match that Issue’s department_seed_key.
- duplicate_of_issue_seed_key should be set only when duplicate_state is linked or possible.
- User-facing notes must not disclose other users’ identities or raw complaint text.
```

---

# 16. Revised Seed Distribution

## Profiles

| Role | Count |
|---|---:|
| user | 4 |
| department_admin | 7 |
| super_admin | 1 |
| **Total** | **12** |

## Complaints by category

| Category | Complaint count | Issue count |
|---|---:|---:|
| sanitation | 25 | 6 |
| water | 18 | 5 |
| roads | 17 | 4 |
| streetlights | 15 | 4 |
| health | 14 | 3 |
| traffic | 11 | 3 |
| **Total** | **100** | **25** |

## Complaints by language

| Language | Target count |
|---|---:|
| English | 52 |
| Hindi | 23 |
| Hinglish | 18 |
| Mixed | 7 |
| **Total** | **100** |

## Complaints by priority

| Priority | Target count |
|---|---:|
| low | 22 |
| medium | 38 |
| high | 32 |
| critical | 8 |
| **Total** | **100** |

---

# 17. Status Synchronization Rules

Because there is no Officer role, the Department Admin is responsible for issue lifecycle actions.

## Issue to Complaint status mapping

| Issue status | Linked Complaint status |
|---|---|
| open | pending |
| in_progress | in_progress |
| resolved | resolved |

## Back-end synchronization algorithm

```text
When Department Admin updates Issue status:

Issue status = open
  → all linked unresolved complaints become pending

Issue status = in_progress
  → all linked pending complaints become in_progress

Issue status = resolved
  → all linked pending/in_progress complaints become resolved
  → create complaint_status_history for every changed complaint
  → create user-visible status note if provided
```

## Resolution authorization

```text
Department Admin may resolve only an Issue where:
issue.department_id == current_user.department_id

Super Admin may resolve any Issue.

Normal User cannot resolve or modify an Issue.
```

---

# 18. Revised Seed Histories

## Complaint history format

### File: `dataset/complaint_status_history.json`

```json
[
  {
    "complaint_seed_key": "cmp-001",
    "status": "pending",
    "note": "Complaint submitted and routed to Solid Waste & Sanitation.",
    "visibility": "user",
    "changed_by_profile_seed_key": null,
    "created_at": "2026-08-28T09:15:00Z",
    "is_synthetic": true
  },
  {
    "complaint_seed_key": "cmp-001",
    "status": "in_progress",
    "note": "The department has started action on the linked civic issue.",
    "visibility": "user",
    "changed_by_profile_seed_key": "profile-admin-sanitation",
    "created_at": "2026-08-30T10:00:00Z",
    "is_synthetic": true
  }
]
```

## Issue history format

### File: `dataset/issue_status_history.json`

```json
[
  {
    "issue_seed_key": "w12_school_waste",
    "status": "open",
    "note": "Issue created from first citizen complaint.",
    "visibility": "department_admin",
    "changed_by_profile_seed_key": null,
    "created_at": "2026-08-25T08:15:00Z",
    "is_synthetic": true
  },
  {
    "issue_seed_key": "market_signal_failure",
    "status": "in_progress",
    "note": "Department Admin verified the traffic-signal issue and initiated action.",
    "visibility": "user",
    "changed_by_profile_seed_key": "profile-admin-traffic",
    "created_at": "2026-08-30T08:45:00Z",
    "is_synthetic": true
  }
]
```

---

# 19. Revised Audit Seed Data

## File: `dataset/audit_logs.json`

Create 15–25 records that prove Department Admin and Super Admin accountability.

```json
[
  {
    "actor_profile_seed_key": "profile-admin-sanitation",
    "entity_type": "issue",
    "entity_seed_key": "w12_school_waste",
    "action": "issue_priority_overridden",
    "before_data": {
      "priority": "medium",
      "priority_score": 42
    },
    "after_data": {
      "priority": "high",
      "priority_score": 55,
      "reason": "School-adjacent mosquito risk confirmed"
    },
    "created_at": "2026-08-30T09:00:00Z",
    "is_synthetic": true
  },
  {
    "actor_profile_seed_key": "profile-super-admin",
    "entity_type": "department",
    "entity_seed_key": "dept-general-review",
    "action": "department_created",
    "before_data": null,
    "after_data": {
      "name": "General Review Queue",
      "active": true
    },
    "created_at": "2026-08-25T06:00:00Z",
    "is_synthetic": true
  }
]
```

---

# 20. Revised Seed File Structure

```text
dataset/
├── README.md
├── departments.json
├── profiles.json
├── user_profile_details.json
├── issues.json
├── complaints.json
├── complaint_status_history.json
├── issue_status_history.json
├── audit_logs.json
├── department_templates.json
├── expected_test_cases.json
├── demo_submissions.json
└── seed_metadata.json

scripts/
├── generate_seed_data.py
├── validate_seed_data.py
└── seed_database.py
```

---

# 21. Revised Seed Database Order

The seeding script must insert records in this exact relationship-safe order.

```text
1. Enable pgvector extension, if used
2. Insert Departments
3. Create Supabase Auth users or create local demo accounts
4. Insert Profiles with mapped auth UUIDs
5. Insert User Profile Details
6. Insert Issues
7. Generate/store Issue representative embeddings
8. Insert Complaints linked to Users and Issues
9. Generate/store Complaint embeddings
10. Insert Complaint Status Histories
11. Insert Issue Status Histories
12. Insert Audit Logs
13. Validate actual Issue complaint_count against linked Complaint count
14. Print summary
```

## Seed script mapping requirement

Because Supabase Auth generates UUIDs, maintain maps like:

```python
department_id_by_seed_key = {
    "dept-sanitation": "actual-uuid"
}

profile_id_by_seed_key = {
    "profile-user-1": "actual-auth-user-uuid"
}

issue_id_by_seed_key = {
    "w12_school_waste": "actual-issue-uuid"
}
```

Never store raw production secrets in dataset JSON files.

---

# 22. Revised Data Validation Rules

## Role validation

- Exactly three roles exist: `user`, `department_admin`, `super_admin`
- No `officer` string may occur in schema, seeds, API roles, UI permissions, or docs
- Every `department_admin` profile has a valid `department_seed_key`
- Every `user` profile has null `department_seed_key`
- Exactly one `super_admin` seed profile exists

## Ownership validation

- Every Complaint is owned by a profile with role `user`
- Every Complaint references one valid Issue
- Every Issue references one valid Department
- Every Issue’s `last_updated_by_profile_seed_key` is the matching Department Admin or Super Admin
- No Complaint user can be a Department Admin unless explicit multi-role support is introduced later

## Count validation

- 7 departments
- 12 profiles
- 4 citizen user profiles
- 7 Department Admin profiles
- 1 Super Admin profile
- 25 Issues
- 100 Complaints
- 25 test cases
- 5 demo submissions

## Security and privacy validation

- No real personal data
- No phone numbers unless explicitly fake/test-safe
- No Aadhaar/PAN/bank/card patterns
- All data has `is_synthetic: true`
- All citizen-visible notes avoid revealing other citizens’ information

## Relationship validation pseudocode

```python
assert all(profile["role"] in {"user", "department_admin", "super_admin"} for profile in profiles)
assert all("officer" not in str(record).lower() for record in all_seed_records)

for complaint in complaints:
    owner = profiles_by_key[complaint["user_profile_seed_key"]]
    issue = issues_by_key[complaint["issue_seed_key"]]
    assert owner["role"] == "user"
    assert complaint["department_seed_key"] == issue["department_seed_key"]

for issue in issues:
    admin = profiles_by_key[issue["last_updated_by_profile_seed_key"]]
    assert admin["role"] in {"department_admin", "super_admin"}
    if admin["role"] == "department_admin":
        assert admin["department_seed_key"] == issue["department_seed_key"]
```

---

# 23. Antigravity Prompt

Copy this prompt into Antigravity after placing this file in your repository.

```text
Read `SIH26S02_Revised_Schema_and_Seed_Data_Plan_3_Roles.md` fully before making changes.

Update the project to use exactly three roles:
- user
- department_admin
- super_admin

Remove the officer role completely from:
- database schema
- enums
- API authorization
- frontend role checks
- seed data
- route names
- assignment fields
- documentation

Implement the relationship model exactly:

User (profile role=user) → creates many Complaints
Complaint → belongs to one Underlying Issue
Issue → belongs to one Department
Department → has one or more Department Admin profiles
Super Admin → has global access

Create/update these database tables exactly as specified:
- departments
- profiles
- user_profile_details
- issues
- complaints
- complaint_status_history
- issue_status_history
- audit_logs

Use Supabase Auth for authentication and `profiles` for role data.
Use pgvector `vector(384)` only if pgvector is configured; otherwise retain a Python cosine-similarity fallback.

Update backend rules:
- Users can create/view only their own complaints and profile.
- Department Admins can access only Issues and Complaints in their assigned department.
- Department Admins update Issues directly; there is no assignment-to-officer workflow.
- Super Admins can manage Departments and Department Admins and view all analytics.
- Resolving an Issue synchronizes all linked unresolved Complaints to resolved.
- All Department Admin/Super Admin overrides create audit logs.

Generate/update seed files exactly under `dataset/`:
- departments.json
- profiles.json
- user_profile_details.json
- issues.json
- complaints.json
- complaint_status_history.json
- issue_status_history.json
- audit_logs.json
- department_templates.json
- expected_test_cases.json
- demo_submissions.json
- seed_metadata.json

Seed requirements:
- 7 departments
- 12 profiles: 4 users, 7 department admins, 1 super admin
- 25 Issues
- 100 Complaints
- Each Complaint must be owned by a user role profile
- Each Issue must belong to a department
- Create multilingual duplicate groups and geo hotspots as documented
- All records must be synthetic and contain required synthetic markers
- No officer role or officer field may exist

Create/update scripts:
- scripts/generate_seed_data.py
- scripts/validate_seed_data.py
- scripts/seed_database.py

Validation must fail if it finds:
- role `officer`
- a Complaint owned by an admin
- a Department Admin without a department
- a user with a department
- an Issue without a valid department
- mismatched Complaint/Issue department references
- incorrect entity counts

Do not expose Supabase service keys in frontend code or seed files.
After implementation, run the validation script and print the resulting file list and validation report.
```

---

# 24. Final MVP Dashboard Changes

## User dashboard

```text
- My Profile summary: name, city, preferred language
- Submit Complaint
- My Complaints
- Current status
- Linked issue status, privacy-safe
- Citizen-visible update timeline
```

## Department Admin dashboard

```text
- Department name and own scoped data
- Open Issues
- Critical / High priority Issues
- Linked complaint impact counts
- Department hotspot map
- Issue status controls
- AI review/override controls
- Department analytics
```

## Super Admin dashboard

```text
- Cross-department KPIs
- Department performance comparison
- All-city hotspot map
- Department management
- Department Admin provisioning
- Audit log viewer
- Low-confidence/General Review monitoring
```

---

# 25. Final Build Checklist

## Schema

- [ ] `app_role` contains only user, department_admin, super_admin
- [ ] No Officer role/table/field exists
- [ ] Supabase Auth → profiles 1:1 mapping is created
- [ ] User-defined details stored in `user_profile_details`
- [ ] Complaint belongs to User and Issue
- [ ] Issue belongs to Department
- [ ] Department Admin belongs to Department
- [ ] Super Admin has global scope
- [ ] Status/audit history tables exist
- [ ] pgvector uses `vector(384)` or backend fallback exists

## Seed data

- [ ] 7 departments
- [ ] 4 Users
- [ ] 7 Department Admins
- [ ] 1 Super Admin
- [ ] 25 Issues
- [ ] 100 Complaints
- [ ] Every complaint belongs to a User
- [ ] Every Issue belongs to a Department
- [ ] Every Department Admin owns exactly one Department in MVP
- [ ] Three visual hotspots
- [ ] English, Hindi, Hinglish complaints
- [ ] Duplicate groups and far-location non-duplicate traps
- [ ] Audit logs for authority actions

## Workflow

- [ ] User defines profile and submits a complaint
- [ ] AI classifies/routes/prioritizes/matches Issue
- [ ] Department Admin sees department-scoped Issue
- [ ] Department Admin changes Issue status
- [ ] Linked complaints synchronize status
- [ ] User sees status update
- [ ] Super Admin can view global data and manage admins/departments

---

# 26. Exactly What to Build

Build a **three-role civic grievance application** with no officer layer:

```text
User
  → defines profile
  → submits complaint
  → sees own complaint and linked Issue status

Department Admin
  → owns one civic department
  → reviews AI-routed Issues in that department
  → updates/overrides/resolves Issues
  → views department hotspot map and analytics

Super Admin
  → manages departments and department admins
  → sees global analytics, all hotspots, review queue, and audit records
```

The operational unit is the **Underlying Issue**, not an individual ticket. Each citizen Complaint is preserved for transparency, but Department Admins act once at the Issue level and the platform synchronizes the result to every linked User.

This reduced role model is faster to implement, easier to secure, easier to demonstrate, and fully sufficient for the SIH MVP.
