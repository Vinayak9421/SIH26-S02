from __future__ import annotations

import json
import os
import sqlite3
import threading
from contextlib import contextmanager
from typing import Any

import numpy as np

from app.ai.embeddings import cosine_similarity

_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "civicpulse.db")
_DB_PATH = os.path.join(os.getcwd(), "civicpulse.db")
_LOCK = threading.Lock()

WARD_NAMES = [f"Ward {i}" for i in range(1, 21)]

# Explicit seed regions so the live pipeline produces realistic ward names.
# (number, lat_min, lat_max, lon_min, lon_max, name)
WARD_REGIONS = [
    (5, 28.5450, 28.5560, 77.2950, 77.3060, "Ward 5"),
    (7, 28.5850, 28.5960, 77.3250, 77.3360, "Ward 7"),
    (12, 28.6090, 28.6200, 77.3180, 77.3290, "Ward 12"),
    (4, 28.5150, 28.5260, 77.3450, 77.3560, "Ward 4"),
    (10, 28.5650, 28.5760, 77.3550, 77.3660, "Ward 10"),
    (17, 28.4350, 28.4460, 77.2750, 77.2860, "Ward 17"),
    (3, 28.6430, 28.6540, 77.1750, 77.1860, "Ward 3"),
    (2, 28.6180, 28.6290, 77.3000, 77.3110, "Ward 2"),
]

_SCHEMA = """
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT, template TEXT
);
CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY, issue_number TEXT UNIQUE NOT NULL, department_id TEXT,
    title TEXT, description TEXT, category TEXT, priority TEXT, priority_score INTEGER,
    complaint_count INTEGER DEFAULT 0, status TEXT DEFAULT 'open',
    latitude REAL, longitude REAL, embedding TEXT, representative_complaint_id TEXT,
    created_at TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY, complaint_number TEXT UNIQUE NOT NULL, user_id TEXT,
    department_id TEXT, issue_id TEXT, text TEXT, normalized_text TEXT, detected_language TEXT,
    category TEXT, embedding TEXT, priority TEXT, priority_score INTEGER, priority_factors TEXT,
    status TEXT DEFAULT 'submitted', latitude REAL, longitude REAL, address TEXT,
    analysis_json TEXT, created_at TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS status_history (
    id TEXT PRIMARY KEY, complaint_id TEXT NOT NULL, status TEXT NOT NULL, changed_by TEXT, changed_at TEXT
);
CREATE TABLE IF NOT EXISTS duplicate_relations (
    id TEXT PRIMARY KEY, complaint_id TEXT NOT NULL, matched_complaint_id TEXT NOT NULL,
    similarity_score REAL, geo_distance REAL, relation_type TEXT
);
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY, actor_id TEXT, entity_type TEXT, entity_id TEXT, action TEXT,
    reason TEXT, before_data TEXT, after_data TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS demo_users (
    email TEXT PRIMARY KEY, role TEXT, department_id TEXT, name TEXT
);
CREATE INDEX IF NOT EXISTS idx_complaints_issue ON complaints(issue_id);
CREATE INDEX IF NOT EXISTS idx_complaints_dept ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_coords ON complaints(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_dupl_comp ON duplicate_relations(complaint_id);
CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at);
"""


@contextmanager
def get_db():
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False, timeout=30)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True) if os.path.dirname(_DB_PATH) else None
    with _LOCK, get_db() as conn:
        conn.executescript(_SCHEMA)


def reset_db():
    """Drop and recreate all tables (used during seeding)."""
    with _LOCK, get_db() as conn:
        for tbl in ["departments", "issues", "complaints", "status_history",
                    "duplicate_relations", "audit_log", "demo_users"]:
            conn.execute(f"DROP TABLE IF EXISTS {tbl}")
        conn.executescript(_SCHEMA)


def _vec(embedding: Any) -> list[float]:
    if embedding is None:
        return []
    if isinstance(embedding, str):
        try:
            return [float(x) for x in json.loads(embedding)]
        except Exception:
            return []
    if isinstance(embedding, (list, tuple)):
        return [float(x) for x in embedding]
    if isinstance(embedding, np.ndarray):
        return embedding.tolist()
    return []


def _row_to_complaint(row: sqlite3.Row) -> dict | None:
    if row is None:
        return None
    factors = row["priority_factors"]
    try:
        factors = json.loads(factors) if factors else []
    except Exception:
        factors = []
    return {
        "id": row["id"], "complaint_number": row["complaint_number"], "user_id": row["user_id"],
        "department_id": row["department_id"], "issue_id": row["issue_id"],
        "text": row["text"], "normalized_text": row["normalized_text"],
        "detected_language": row["detected_language"], "category": row["category"],
        "embedding": _vec(row["embedding"]), "priority": row["priority"],
        "priority_score": row["priority_score"], "priority_factors": factors,
        "status": row["status"], "latitude": row["latitude"], "longitude": row["longitude"],
        "address": row["address"], "analysis_json": row["analysis_json"],
        "created_at": row["created_at"], "updated_at": row["updated_at"],
    }


def _row_to_issue(row: sqlite3.Row) -> dict | None:
    if row is None:
        return None
    return {
        "id": row["id"], "issue_number": row["issue_number"], "department_id": row["department_id"],
        "title": row["title"], "description": row["description"], "category": row["category"],
        "priority": row["priority"], "priority_score": row["priority_score"],
        "complaint_count": row["complaint_count"], "status": row["status"],
        "latitude": row["latitude"], "longitude": row["longitude"],
        "embedding": _vec(row["embedding"]),
        "representative_complaint_id": row["representative_complaint_id"],
        "created_at": row["created_at"], "updated_at": row["updated_at"],
    }


# --- Departments ---
def insert_department(conn, dept_id, name, description, template):
    conn.execute(
        "INSERT INTO departments (id,name,description,template) VALUES (?,?,?,?)",
        (dept_id, name, description, template),
    )


def get_all_departments() -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM departments ORDER BY name").fetchall()
    return [{"id": r["id"], "name": r["name"], "description": r["description"], "template": r["template"]} for r in rows]


def get_department_by_name(name: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM departments WHERE name=?", (name,)).fetchone()
    if not row:
        return None
    return {"id": row["id"], "name": row["name"], "description": row["description"], "template": row["template"]}


# --- Issues ---
def insert_issue(conn, issue: dict) -> dict:
    conn.execute(
        """INSERT INTO issues (id, issue_number, department_id, title, description, category,
            priority, priority_score, complaint_count, status, latitude, longitude,
            embedding, representative_complaint_id, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (issue["id"], issue["issue_number"], issue.get("department_id"), issue["title"],
         issue.get("description", ""), issue["category"], issue.get("priority", "LOW"),
         issue.get("priority_score", 0), issue.get("complaint_count", 0), issue.get("status", "open"),
         issue.get("latitude"), issue.get("longitude"),
         json.dumps(issue.get("embedding", [])), issue.get("representative_complaint_id"),
         issue["created_at"], issue["updated_at"]),
    )
    return issue


def get_issue(issue_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM issues WHERE id=?", (issue_id,)).fetchone()
    return _row_to_issue(row)


def get_all_issues() -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM issues ORDER BY created_at DESC").fetchall()
    return [_row_to_issue(r) for r in rows]


def get_issues_by_department(dept_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM issues WHERE department_id=? ORDER BY created_at DESC", (dept_id,)).fetchall()
    return [_row_to_issue(r) for r in rows]


def update_issue(conn, issue_id, **fields):
    cols = ", ".join([f"{k}=?" for k in fields])
    vals = list(fields.values()) + [issue_id]
    conn.execute(f"UPDATE issues SET {cols} WHERE id=?", vals)


def update_issue(conn, issue_id, **fields):
    cols = ", ".join([f"{k}=?" for k in fields])
    vals = list(fields.values()) + [issue_id]
    conn.execute(f"UPDATE issues SET {cols} WHERE id=?", vals)


# --- Complaints ---
def insert_complaint(conn, comp: dict) -> dict:
    conn.execute(
        """INSERT INTO complaints (id, complaint_number, user_id, department_id, issue_id, text,
            normalized_text, detected_language, category, embedding, priority, priority_score,
            priority_factors, status, latitude, longitude, address, analysis_json, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (comp["id"], comp["complaint_number"], comp.get("user_id"), comp.get("department_id"),
         comp.get("issue_id"), comp["text"], comp.get("normalized_text"), comp.get("detected_language"),
         comp.get("category"), json.dumps(comp.get("embedding", [])), comp.get("priority"),
         comp.get("priority_score", 0), json.dumps(comp.get("priority_factors", [])),
         comp.get("status", "submitted"), comp.get("latitude"), comp.get("longitude"),
         comp.get("address"), json.dumps(comp.get("analysis_json", {})),
         comp["created_at"], comp["updated_at"]),
    )
    return comp


def get_complaint(complaint_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM complaints WHERE id=?", (complaint_id,)).fetchone()
    return _row_to_complaint(row)


def get_all_complaints() -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM complaints ORDER BY created_at DESC").fetchall()
    return [_row_to_complaint(r) for r in rows]


def get_complaints_by_issue(issue_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM complaints WHERE issue_id=? ORDER BY created_at DESC", (issue_id,)).fetchall()
    return [_row_to_complaint(r) for r in rows]


def get_complaints_by_user(user_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM complaints WHERE user_id=? ORDER BY created_at DESC", (user_id,)).fetchall()
    return [_row_to_complaint(r) for r in rows]


def get_complaints_by_department(dept_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM complaints WHERE department_id=? ORDER BY created_at DESC", (dept_id,)).fetchall()
    return [_row_to_complaint(r) for r in rows]


def update_complaint(conn, complaint_id, **fields):
    cols = ", ".join([f"{k}=?" for k in fields])
    vals = list(fields.values()) + [complaint_id]
    conn.execute(f"UPDATE complaints SET {cols} WHERE id=?", vals)


# --- Duplicate relations ---
def insert_duplicate_relation(conn, complaint_id, matched_complaint_id, similarity, distance, rel_type):
    conn.execute(
        "INSERT INTO duplicate_relations (id, complaint_id, matched_complaint_id, similarity_score, geo_distance, relation_type) VALUES (?,?,?,?,?,?)",
        (_new_uuid(), complaint_id, matched_complaint_id, similarity, distance, rel_type),
    )


def get_duplicate_relations(complaint_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM duplicate_relations WHERE complaint_id=?", (complaint_id,)).fetchall()
    return [{"complaint_id": r["complaint_id"], "matched_complaint_id": r["matched_complaint_id"],
             "similarity_score": r["similarity_score"], "geo_distance": r["geo_distance"],
             "relation_type": r["relation_type"]} for r in rows]


# --- Status history ---
def insert_status_history(conn, complaint_id, status, changed_by):
    conn.execute(
        "INSERT INTO status_history (id, complaint_id, status, changed_by, changed_at) VALUES (?,?,?,?,?)",
        (_new_uuid(), complaint_id, status, changed_by, _now()),
    )


def get_status_history(complaint_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM status_history WHERE complaint_id=? ORDER BY changed_at ASC", (complaint_id,)).fetchall()
    return [{"id": r["id"], "complaint_id": r["complaint_id"], "status": r["status"],
             "changed_by": r["changed_by"], "changed_at": r["changed_at"]} for r in rows]


# --- Audit ---
def insert_audit(conn, actor_id, entity_type, entity_id, action, before, after, reason=None):
    conn.execute(
        "INSERT INTO audit_log (id, actor_id, entity_type, entity_id, action, reason, before_data, after_data, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
        (_new_uuid(), actor_id, entity_type, entity_id, action, reason, json.dumps(before), json.dumps(after), _now()),
    )


def get_issue_complaint_count(issue_id: str) -> int:
    with get_db() as conn:
        row = conn.execute("SELECT COUNT(*) AS c FROM complaints WHERE issue_id=?", (issue_id,)).fetchone()
    return row["c"] if row else 0


def next_complaint_number(conn) -> str:
    row = conn.execute("SELECT MAX(complaint_number) AS mx FROM complaints").fetchone()
    last = row["mx"] if row else None
    if last and last.startswith("CR-"):
        try:
            nxt = int(last.split("-")[1]) + 1
        except ValueError:
            nxt = 1
    else:
        nxt = 1
    return f"CR-{nxt:04d}"


def next_issue_number(conn) -> str:
    row = conn.execute("SELECT MAX(issue_number) AS mx FROM issues").fetchone()
    last = row["mx"] if row else None
    if last and last.startswith("ISS-"):
        try:
            nxt = int(last.split("-")[1]) + 1
        except ValueError:
            nxt = 1
    else:
        nxt = 1
    return f"ISS-{nxt:04d}"


def _new_uuid() -> str:
    return str(__import__("uuid").uuid4())


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def get_ward(latitude, longitude) -> str | None:
    if latitude is None or longitude is None:
        return None
    for _num, lmin, lmax, gmin, gmax, name in WARD_REGIONS:
        if lmin <= latitude <= lmax and gmin <= longitude <= gmax:
            return name
    # Fallback grid-based assignment.
    lat_cell = int(latitude * 100) % 20
    lon_cell = int(longitude * 100) % 20
    idx = (lat_cell + lon_cell) % 20
    return WARD_NAMES[idx]
