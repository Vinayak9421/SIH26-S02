import os
import sys
import json
import uuid
import random
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# Try importing psycopg2 or sqlalchemy
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor, execute_values
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

try:
    from sqlalchemy import create_engine, text
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False

# Load environment variables from backend/.env or root .env
candidate_paths = [
    os.path.join(os.path.dirname(__file__), "..", "backend", ".env"),
    os.path.join(os.path.dirname(__file__), "..", ".env"),
    os.path.join(os.getcwd(), "backend", ".env"),
    os.path.join(os.getcwd(), ".env")
]

for env_path in candidate_paths:
    if os.path.exists(env_path) and os.path.getsize(env_path) > 0:
        load_dotenv(dotenv_path=env_path, override=True)
        print(f"Loaded environment variables from {env_path}")
        break

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    if not DATABASE_URL or "your_password" in DATABASE_URL or "ep-cool-sample" in DATABASE_URL:
        print("\n=======================================================")
        print("ERROR: DATABASE_URL in backend/.env is missing or invalid.")
        print("Please update backend/.env with your valid Neon PostgreSQL URL.")
        print("Example format:")
        print("DATABASE_URL=postgresql://neondb_owner:password@ep-something.aws.neon.tech/neondb?sslmode=require")
        print("=======================================================\n")
        sys.exit(1)
        
    normalized_url = DATABASE_URL
    if normalized_url.startswith("postgres://"):
        normalized_url = normalized_url.replace("postgres://", "postgresql://", 1)

    print(f"Connecting to Neon PostgreSQL database...")
    if HAS_PSYCOPG2:
        # Strip query params like sslmode for direct psycopg2 connect if needed
        conn = psycopg2.connect(normalized_url)
        conn.autocommit = True
        return conn
    elif HAS_SQLALCHEMY:
        if normalized_url.startswith("postgresql://") and not normalized_url.startswith("postgresql+psycopg2://"):
            normalized_url = normalized_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        engine = create_engine(normalized_url)
        return engine.connect()
    else:
        print("ERROR: Neither psycopg2 nor sqlalchemy installed. Please install psycopg2-binary or sqlalchemy.")
        sys.exit(1)

def apply_schema(conn):
    schema_file = os.path.join(os.path.dirname(__file__), "schema_3_roles.sql")
    print(f"Reading schema from {schema_file}...")
    with open(schema_file, "r", encoding="utf-8") as f:
        sql = f.read()

    print("Applying 3-Role database schema to Neon DB...")
    if HAS_PSYCOPG2 and isinstance(conn, psycopg2.extensions.connection):
        with conn.cursor() as cur:
            cur.execute(sql)
    else:
        conn.execute(text(sql))
        conn.commit()
    print("Schema applied successfully!")

def seed_database(conn):
    print("Seeding database with 3-Role benchmark dataset...")

    # helper for executing SQL
    def execute(query, params=None):
        if HAS_PSYCOPG2 and isinstance(conn, psycopg2.extensions.connection):
            with conn.cursor() as cur:
                cur.execute(query, params)
        else:
            conn.execute(text(query), params or {})
            conn.commit()

    # 1. Departments Data
    departments_data = [
        {"key": "sanitation", "name": "Solid Waste & Sanitation", "desc": "Waste pickup, street sweeping, dumpsters, public hygiene"},
        {"key": "water", "name": "Water Supply", "desc": "Drinking water pipelines, water pressure, leaks, contamination"},
        {"key": "roads", "name": "Roads & Infrastructure", "desc": "Potholes, broken footpaths, road resurfacing, asphalt repair"},
        {"key": "streetlights", "name": "Electrical / Street Lighting", "desc": "Street lights out, exposed wiring, transformer sparks"},
        {"key": "health", "name": "Public Health & Vector Control", "desc": "Stagnant water, mosquito breeding, stray animals, disease outbreaks"},
        {"key": "traffic", "name": "Traffic & Public Transport", "desc": "Traffic signals, illegal parking, bus stop maintenance, road signs"},
        {"key": "general_review", "name": "General Review Queue", "desc": "Unclassified civic reports requiring human verification"}
    ]

    dept_id_map = {}
    for d in departments_data:
        dept_id = str(uuid.uuid4())
        dept_id_map[d["key"]] = dept_id
        execute(
            """
            INSERT INTO public.departments (id, name, category_key, description, active)
            VALUES (%s, %s, %s, %s, true)
            ON CONFLICT (category_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
            RETURNING id;
            """ if HAS_PSYCOPG2 else
            """
            INSERT INTO public.departments (id, name, category_key, description, active)
            VALUES (:id, :name, :category_key, :description, true)
            ON CONFLICT (category_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
            """,
            {"id": dept_id, "name": d["name"], "category_key": d["key"], "description": d["desc"]} if not HAS_PSYCOPG2 else (dept_id, d["name"], d["key"], d["desc"])
        )
    print(f"[OK] Created {len(departments_data)} departments.")

    # Fetch confirmed Dept IDs from DB to ensure mapping accuracy
    if HAS_PSYCOPG2 and isinstance(conn, psycopg2.extensions.connection):
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, category_key FROM public.departments;")
            for r in cur.fetchall():
                dept_id_map[r["category_key"]] = str(r["id"])

    # 2. Profiles Data (1 Super Admin, 7 Dept Admins, 4 Citizens)
    profiles_data = [
        {"key": "super_admin", "name": "System Administrator", "email": "admin@civicissue.demo", "role": "super_admin", "dept": None},
        {"key": "admin_sanitation", "name": "Asha Rao", "email": "sanitation.admin@civicissue.demo", "role": "department_admin", "dept": "sanitation"},
        {"key": "admin_water", "name": "Rahul Shah", "email": "water.admin@civicissue.demo", "role": "department_admin", "dept": "water"},
        {"key": "admin_roads", "name": "Neha Kulkarni", "email": "roads.admin@civicissue.demo", "role": "department_admin", "dept": "roads"},
        {"key": "admin_streetlights", "name": "Vikram Iyer", "email": "streetlights.admin@civicissue.demo", "role": "department_admin", "dept": "streetlights"},
        {"key": "admin_health", "name": "Farah Khan", "email": "health.admin@civicissue.demo", "role": "department_admin", "dept": "health"},
        {"key": "admin_traffic", "name": "Arjun Menon", "email": "traffic.admin@civicissue.demo", "role": "department_admin", "dept": "traffic"},
        {"key": "admin_review", "name": "Review Administrator", "email": "review.admin@civicissue.demo", "role": "department_admin", "dept": "general_review"},
        {"key": "user_1", "name": "Citizen One (Mihir)", "email": "citizen1@civicissue.demo", "role": "user", "dept": None},
        {"key": "user_2", "name": "Citizen Two (Priya)", "email": "citizen2@civicissue.demo", "role": "user", "dept": None},
        {"key": "user_3", "name": "Citizen Three (Amit)", "email": "citizen3@civicissue.demo", "role": "user", "dept": None},
        {"key": "user_4", "name": "Citizen Four (Sangeeta)", "email": "citizen4@civicissue.demo", "role": "user", "dept": None},
    ]

    profile_id_map = {}
    for p in profiles_data:
        p_id = str(uuid.uuid4())
        profile_id_map[p["key"]] = p_id
        d_id = dept_id_map.get(p["dept"]) if p["dept"] else None
        
        execute(
            """
            INSERT INTO public.profiles (id, full_name, email, role, department_id, is_active)
            VALUES (%s, %s, %s, %s, %s, true)
            ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, department_id = EXCLUDED.department_id;
            """ if HAS_PSYCOPG2 else
            """
            INSERT INTO public.profiles (id, full_name, email, role, department_id, is_active)
            VALUES (:id, :full_name, :email, :role, :department_id, true)
            ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, department_id = EXCLUDED.department_id;
            """,
            {"id": p_id, "full_name": p["name"], "email": p["email"], "role": p["role"], "department_id": d_id} if not HAS_PSYCOPG2 else (p_id, p["name"], p["email"], p["role"], d_id)
        )
    print(f"[OK] Created {len(profiles_data)} profiles (1 Super Admin, 7 Dept Admins, 4 Users).")

    # Fetch confirmed profile IDs
    if HAS_PSYCOPG2 and isinstance(conn, psycopg2.extensions.connection):
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, email FROM public.profiles;")
            email_to_key = {p["email"]: p["key"] for p in profiles_data}
            for r in cur.fetchall():
                if r["email"] in email_to_key:
                    profile_id_map[email_to_key[r["email"]]] = str(r["id"])

    # 3. User Profile Details Data (for citizen users)
    citizen_details = [
        {"user_key": "user_1", "lang": "en", "city": "Mumbai", "ward": "Ward 12", "lat": 19.0762, "lng": 72.8777},
        {"user_key": "user_2", "lang": "hinglish", "city": "Mumbai", "ward": "Ward 6", "lat": 19.0700, "lng": 72.8700},
        {"user_key": "user_3", "lang": "hi", "city": "Mumbai", "ward": "Ward 12", "lat": 19.0764, "lng": 72.8780},
        {"user_key": "user_4", "lang": "en", "city": "Mumbai", "ward": "Ward 17", "lat": 19.0950, "lng": 72.9050},
    ]

    for cd in citizen_details:
        u_id = profile_id_map[cd["user_key"]]
        execute(
            """
            INSERT INTO public.user_profile_details (user_id, preferred_language, city, locality_or_ward, default_latitude, default_longitude)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET locality_or_ward = EXCLUDED.locality_or_ward;
            """ if HAS_PSYCOPG2 else
            """
            INSERT INTO public.user_profile_details (user_id, preferred_language, city, locality_or_ward, default_latitude, default_longitude)
            VALUES (:user_id, :preferred_language, :city, :locality_or_ward, :default_latitude, :default_longitude)
            ON CONFLICT (user_id) DO UPDATE SET locality_or_ward = EXCLUDED.locality_or_ward;
            """,
            {"user_id": u_id, "preferred_language": cd["lang"], "city": cd["city"], "locality_or_ward": cd["ward"], "default_latitude": cd["lat"], "default_longitude": cd["lng"]} if not HAS_PSYCOPG2 else (u_id, cd["lang"], cd["city"], cd["ward"], cd["lat"], cd["lng"])
        )
    print(f"[OK] Created {len(citizen_details)} citizen user profile details.")

    # 4. 25 Underlying Civic Issues
    issues_seed_data = [
        # Sanitation (6 issues)
        {"key": "iss_san_1", "dept": "sanitation", "title": "Overflowing garbage dump near Ward 12 Municipal School", "cat": "sanitation", "prio": "high", "score": 75, "status": "open", "lat": 19.0762, "lng": 72.8777, "address": "Near Municipal School, Ward 12", "reasons": ["School nearby (+20)", "Mosquito breeding risk (+20)", "3+ days delay (+15)"]},
        {"key": "iss_san_2", "dept": "sanitation", "title": "Uncollected commercial waste at Central Market Road", "cat": "sanitation", "prio": "critical", "score": 90, "status": "in_progress", "lat": 19.0800, "lng": 72.8820, "address": "Central Market Gate 2, Ward 6", "reasons": ["High footfall commercial area (+30)", "Severe foul odor (+25)"]},
        {"key": "iss_san_3", "dept": "sanitation", "title": "Broken community trash container leaking liquid waste", "cat": "sanitation", "prio": "medium", "score": 50, "status": "open", "lat": 19.0720, "lng": 72.8710, "address": "Station Road West, Ward 12", "reasons": ["Container damaged (+15)", "Leachate pollution (+15)"]},
        {"key": "iss_san_4", "dept": "sanitation", "title": "Dead animal remains on public pavement near park", "cat": "sanitation", "prio": "high", "score": 80, "status": "resolved", "lat": 19.0910, "lng": 72.9010, "address": "Children Park Entrance, Ward 17", "reasons": ["Health hazards (+30)", "Park vicinity (+20)"]},
        {"key": "iss_san_5", "dept": "sanitation", "title": "Illegal dumping of construction debris along highway wall", "cat": "sanitation", "prio": "medium", "score": 45, "status": "open", "lat": 19.0650, "lng": 72.8600, "address": "Eastern Service Road, Ward 4", "reasons": ["Obstruction to walkway (+15)"]},
        {"key": "iss_san_6", "dept": "sanitation", "title": "Unswept leaf litter and dust blocking storm drains", "cat": "sanitation", "prio": "low", "score": 30, "status": "open", "lat": 19.0780, "lng": 72.8750, "address": "Subhash Nagar 3rd Lane, Ward 12", "reasons": ["Drain blockage risk (+10)"]},

        # Water (5 issues)
        {"key": "iss_wat_1", "dept": "water", "title": "Major underground pipeline burst causing road flooding", "cat": "water", "prio": "critical", "score": 95, "status": "in_progress", "lat": 19.0740, "lng": 72.8730, "address": "Main Water Works Junction, Ward 12", "reasons": ["Clean water loss (+35)", "Substantial road erosion (+25)"]},
        {"key": "iss_wat_2", "dept": "water", "title": "Contaminated muddy water supply reported across Sector 4", "cat": "water", "prio": "high", "score": 85, "status": "open", "lat": 19.0680, "lng": 72.8690, "address": "Sector 4 Residential Block, Ward 6", "reasons": ["Public drinking health hazard (+40)"]},
        {"key": "iss_wat_3", "dept": "water", "title": "Low water pressure during morning hours in high-rise buildings", "cat": "water", "prio": "medium", "score": 45, "status": "open", "lat": 19.0960, "lng": 72.9060, "address": "Green Avenue, Ward 17", "reasons": ["Multiple households affected (+20)"]},
        {"key": "iss_wat_4", "dept": "water", "title": "Leaking public water standpost valve wasting water daily", "cat": "water", "prio": "medium", "score": 40, "status": "resolved", "lat": 19.0790, "lng": 72.8790, "address": "Slum Colony Gate 1, Ward 12", "reasons": ["Continuous wastage (+15)"]},
        {"key": "iss_wat_5", "dept": "water", "title": "Missing manhole cover on main water supply chamber", "cat": "water", "prio": "high", "score": 75, "status": "open", "lat": 19.0830, "lng": 72.8850, "address": "Market Road Corner, Ward 6", "reasons": ["Open fall hazard (+30)"]},

        # Roads (4 issues)
        {"key": "iss_rd_1", "dept": "roads", "title": "Dangerous deep pothole crater near flyover landing", "cat": "roads", "prio": "critical", "score": 92, "status": "open", "lat": 19.0770, "lng": 72.8790, "address": "Ward 12 Flyover Exit", "reasons": ["Vehicle damage & accident risk (+40)"]},
        {"key": "iss_rd_2", "dept": "roads", "title": "Caved-in footpath slab endangering pedestrians", "cat": "roads", "prio": "high", "score": 70, "status": "in_progress", "lat": 19.0710, "lng": 72.8720, "address": "Station Promenade, Ward 12", "reasons": ["Pedestrian fall hazard (+25)"]},
        {"key": "iss_rd_3", "dept": "roads", "title": "Unfinished road trench left open without warning barricades", "cat": "roads", "prio": "high", "score": 78, "status": "open", "lat": 19.0940, "lng": 72.9030, "address": "Link Road, Ward 17", "reasons": ["Lack of safety lights (+25)"]},
        {"key": "iss_rd_4", "dept": "roads", "title": "Faded speed breaker markings near hospital zone", "cat": "roads", "prio": "medium", "score": 50, "status": "resolved", "lat": 19.0690, "lng": 72.8680, "address": "Civil Hospital Road, Ward 6", "reasons": ["Hospital area safety (+15)"]},

        # Streetlights (4 issues)
        {"key": "iss_lt_1", "dept": "streetlights", "title": "Complete dark stretch of 10 streetlights on Girls College Road", "cat": "streetlights", "prio": "critical", "score": 88, "status": "open", "lat": 19.0765, "lng": 72.8765, "address": "College Road, Ward 12", "reasons": ["Women safety concern (+35)", "Dark zone (+25)"]},
        {"key": "iss_lt_2", "dept": "streetlights", "title": "Exposed live electric wires hanging from streetlight pole", "cat": "streetlights", "prio": "critical", "score": 94, "status": "in_progress", "lat": 19.0810, "lng": 72.8830, "address": "Market Main Street, Ward 6", "reasons": ["Electrocution risk (+45)"]},
        {"key": "iss_lt_3", "dept": "streetlights", "title": "Flickering LED streetlights near bus terminal", "cat": "streetlights", "prio": "low", "score": 35, "status": "open", "lat": 19.0930, "lng": 72.9020, "address": "Bus Stand North, Ward 17", "reasons": ["Driver glare (+10)"]},
        {"key": "iss_lt_4", "dept": "streetlights", "title": "Damaged pole leaning precariously after storm", "cat": "streetlights", "prio": "high", "score": 76, "status": "resolved", "lat": 19.0730, "lng": 72.8740, "address": "Ward 12 Garden Road", "reasons": ["Pole collapse risk (+30)"]},

        # Health (3 issues)
        {"key": "iss_hl_1", "dept": "health", "title": "Stagnant drainage pool causing severe dengue/mosquito infestation", "cat": "health", "prio": "critical", "score": 91, "status": "open", "lat": 19.0760, "lng": 72.8785, "address": "Behind Municipal School, Ward 12", "reasons": ["Vector disease outbreak (+40)", "School children risk (+20)"]},
        {"key": "iss_hl_2", "dept": "health", "title": "Aggressive stray dog pack near primary healthcare centre", "cat": "health", "prio": "high", "score": 72, "status": "in_progress", "lat": 19.0705, "lng": 72.8715, "address": "Ward 12 Health Dispensary", "reasons": ["Public bite incidents (+25)"]},
        {"key": "iss_hl_3", "dept": "health", "title": "Chemical fumes odor emanating from illegal small workshop", "cat": "health", "prio": "medium", "score": 58, "status": "open", "lat": 19.0970, "lng": 72.9070, "address": "Industrial Lane, Ward 17", "reasons": ["Respiratory discomfort (+15)"]},

        # Traffic (3 issues)
        {"key": "iss_tr_1", "dept": "traffic", "title": "Non-functional traffic signal light at busy four-way junction", "cat": "traffic", "prio": "high", "score": 82, "status": "open", "lat": 19.0820, "lng": 72.8840, "address": "Market Junction, Ward 6", "reasons": ["Traffic congestion & crash risk (+35)"]},
        {"key": "iss_tr_2", "dept": "traffic", "title": "Unauthorized truck parking blocking emergency ambulance lane", "cat": "traffic", "prio": "critical", "score": 89, "status": "in_progress", "lat": 19.0695, "lng": 72.8685, "address": "Hospital Emergency Gate, Ward 6", "reasons": ["Ambulance passage blocked (+40)"]},
        {"key": "iss_tr_3", "dept": "traffic", "title": "Broken auto-rickshaw stand signboard lying on road", "cat": "traffic", "prio": "low", "score": 28, "status": "resolved", "lat": 19.0750, "lng": 72.8755, "address": "Station East, Ward 12", "reasons": ["Minor obstruction (+10)"]}
    ]

    issue_id_map = {}
    for iss in issues_seed_data:
        iss_id = str(uuid.uuid4())
        issue_id_map[iss["key"]] = iss_id
        d_id = dept_id_map[iss["dept"]]
        created_by_id = profile_id_map["user_1"]
        admin_by_id = profile_id_map[f"admin_{iss['dept']}"]
        
        execute(
            """
            INSERT INTO public.issues (
                id, department_id, title, summary, category, priority, priority_score,
                priority_reasons, status, latitude, longitude, address, hotspot_key,
                created_by, last_updated_by
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING;
            """ if HAS_PSYCOPG2 else
            """
            INSERT INTO public.issues (
                id, department_id, title, summary, category, priority, priority_score,
                priority_reasons, status, latitude, longitude, address, hotspot_key,
                created_by, last_updated_by
            ) VALUES (
                :id, :department_id, :title, :summary, :category, :priority, :priority_score,
                :priority_reasons, :status, :latitude, :longitude, :address, :hotspot_key,
                :created_by, :last_updated_by
            ) ON CONFLICT DO NOTHING;
            """,
            {
                "id": iss_id, "department_id": d_id, "title": iss["title"], "summary": iss["title"],
                "category": iss["cat"], "priority": iss["prio"], "priority_score": iss["score"],
                "priority_reasons": json.dumps(iss["reasons"]), "status": iss["status"],
                "latitude": iss["lat"], "longitude": iss["lng"], "address": iss["address"],
                "hotspot_key": f"hotspot_{iss['cat']}_w12" if "12" in iss["address"] else f"hotspot_{iss['cat']}",
                "created_by": created_by_id, "last_updated_by": admin_by_id
            } if not HAS_PSYCOPG2 else (
                iss_id, d_id, iss["title"], iss["title"], iss["cat"], iss["prio"], iss["score"],
                json.dumps(iss["reasons"]), iss["status"], iss["lat"], iss["lng"], iss["address"],
                f"hotspot_{iss['cat']}_w12" if "12" in iss["address"] else f"hotspot_{iss['cat']}",
                created_by_id, admin_by_id
            )
        )
    print(f"[OK] Created {len(issues_seed_data)} civic issues across 6 core departments.")

    # 5. Generate 100 Complaints Distributed Across the 25 Issues
    print("Generating 100 citizen complaint submissions linked to underlying issues...")

    # Template texts for complaints (English, Hindi, Hinglish)
    text_templates = {
        "sanitation": [
            "Garbage has not been collected near {addr} for {days} days. Smell is unbearable.",
            "{addr} ke paas teen din se kachra nahi uthaya gaya hai. Bohot badboo aa rahi hai aur macchar ho gaye hai.",
            "Huge heap of waste dumping near {addr}. Please clear garbage immediately.",
            "Dustbin overflowing at {addr}. Stagnant waste creating public nuisance."
        ],
        "water": [
            "Water supply pipeline leaking badly at {addr}. Gallons of clean water wasting.",
            "{addr} mein ganda aur mela paani aa raha hai pichle 2 din se.",
            "No water pressure in taps near {addr}. Main distribution line issue suspected.",
            "Water post pipe broken at {addr}. Clean drinking water flooding street."
        ],
        "roads": [
            "Dangerous deep pothole on road near {addr}. Vehicles losing control.",
            "{addr} par rasta kharab hai aur bada gaddha pada hai. Accident ka dar hai.",
            "Footpath tiles broken and collapsed near {addr}. Elderly people falling.",
            "Road trench left unpaved and open near {addr}. No safety warning signs."
        ],
        "streetlights": [
            "Streetlights not working on the entire lane near {addr}. Completely dark at night.",
            "{addr} ke paas light nahi jal rahi 4 din se. Raat ko bohot andhera rehta hai.",
            "Live wires hanging dangerously from electrical pole at {addr}.",
            "Street light pole damaged and leaning towards road near {addr}."
        ],
        "health": [
            "Stagnant water pond near {addr} causing heavy mosquito infestation.",
            "{addr} ke piche ganda paani bhara hua hai. Dengue ka khatra badh raha hai.",
            "Stray dogs barking and biting pedestrians near {addr} dispensary."
        ],
        "traffic": [
            "Traffic light signal not working at {addr}. Huge traffic jam occurring.",
            "{addr} par signal band hai, gaadiyan aapas mein takra rahi hai.",
            "Illegal parking blocking main emergency road near {addr}."
        ]
    }

    complaint_count = 0
    issue_complaint_counts = {}

    for i in range(100):
        # Pick an issue
        iss = issues_seed_data[i % len(issues_seed_data)]
        iss_id = issue_id_map[iss["key"]]
        d_id = dept_id_map[iss["dept"]]
        
        # Pick a citizen user
        user_key = f"user_{(i % 4) + 1}"
        u_id = profile_id_map[user_key]

        # Generate complaint text
        cat = iss["cat"]
        templates = text_templates.get(cat, text_templates["sanitation"])
        tmpl = random.choice(templates)
        text_content = tmpl.format(addr=iss["address"], days=random.randint(2, 5))

        # Status mapping: issue status -> complaint status
        c_status = "pending"
        if iss["status"] == "in_progress":
            c_status = "in_progress" if random.random() > 0.2 else "pending"
        elif iss["status"] == "resolved":
            c_status = "resolved"

        dup_state = "linked" if issue_complaint_counts.get(iss_id, 0) > 0 else "none"
        issue_complaint_counts[iss_id] = issue_complaint_counts.get(iss_id, 0) + 1

        cmp_id = str(uuid.uuid4())
        
        # Random slight jitter in location to simulate nearby citizen submissions
        lat_jitter = iss["lat"] + random.uniform(-0.001, 0.001)
        lng_jitter = iss["lng"] + random.uniform(-0.001, 0.001)

        execute(
            """
            INSERT INTO public.complaints (
                id, user_id, issue_id, department_id, text, normalized_text, language_hint,
                ai_category, ai_confidence, priority, priority_score, priority_reasons,
                duplicate_state, duplicate_of_issue_id, status, latitude, longitude, address,
                citizen_visible_note
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """ if HAS_PSYCOPG2 else
            """
            INSERT INTO public.complaints (
                id, user_id, issue_id, department_id, text, normalized_text, language_hint,
                ai_category, ai_confidence, priority, priority_score, priority_reasons,
                duplicate_state, duplicate_of_issue_id, status, latitude, longitude, address,
                citizen_visible_note
            ) VALUES (
                :id, :user_id, :issue_id, :department_id, :text, :normalized_text, :language_hint,
                :ai_category, :ai_confidence, :priority, :priority_score, :priority_reasons,
                :duplicate_state, :duplicate_of_issue_id, :status, :latitude, :longitude, :address,
                :citizen_visible_note
            );
            """,
            {
                "id": cmp_id, "user_id": u_id, "issue_id": iss_id, "department_id": d_id,
                "text": text_content, "normalized_text": text_content.lower(),
                "language_hint": "hi" if "ke paas" in text_content or "bohot" in text_content else "en",
                "ai_category": cat, "ai_confidence": round(random.uniform(0.85, 0.98), 2),
                "priority": iss["prio"], "priority_score": iss["score"],
                "priority_reasons": json.dumps(iss["reasons"]), "duplicate_state": dup_state,
                "duplicate_of_issue_id": iss_id if dup_state == "linked" else None,
                "status": c_status, "latitude": lat_jitter, "longitude": lng_jitter, "address": iss["address"],
                "citizen_visible_note": f"Grouped with underlying civic issue '{iss['title']}'."
            } if not HAS_PSYCOPG2 else (
                cmp_id, u_id, iss_id, d_id, text_content, text_content.lower(),
                "hi" if "ke paas" in text_content or "bohot" in text_content else "en",
                cat, round(random.uniform(0.85, 0.98), 2), iss["prio"], iss["score"],
                json.dumps(iss["reasons"]), dup_state, iss_id if dup_state == "linked" else None,
                c_status, lat_jitter, lng_jitter, iss["address"],
                f"Grouped with underlying civic issue '{iss['title']}'."
            )
        )
        complaint_count += 1

    print(f"[OK] Created {complaint_count} citizen complaints.")

    # 6. Update Issue complaint_count fields
    print("Updating Issue complaint counts...")
    for iss_key, iss_id in issue_id_map.items():
        cnt = issue_complaint_counts.get(iss_id, 0)
        execute(
            "UPDATE public.issues SET complaint_count = %s WHERE id = %s;" if HAS_PSYCOPG2 else
            "UPDATE public.issues SET complaint_count = :cnt WHERE id = :id;",
            {"cnt": cnt, "id": iss_id} if not HAS_PSYCOPG2 else (cnt, iss_id)
        )

    # 7. Insert Audit Logs
    print("Inserting audit trail logs...")
    audit_data = [
        {"actor": profile_id_map["admin_sanitation"], "type": "issue", "id": issue_id_map["iss_san_1"], "act": "issue_priority_overridden"},
        {"actor": profile_id_map["super_admin"], "type": "department", "id": dept_id_map["general_review"], "act": "department_created"},
        {"actor": profile_id_map["admin_water"], "type": "issue", "id": issue_id_map["iss_wat_1"], "act": "issue_status_updated"}
    ]
    for a in audit_data:
        execute(
            """
            INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, before_data, after_data)
            VALUES (%s, %s, %s, %s, '{"status": "open"}'::jsonb, '{"status": "in_progress"}'::jsonb);
            """ if HAS_PSYCOPG2 else
            """
            INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, before_data, after_data)
            VALUES (:actor_id, :entity_type, :entity_id, :action, '{"status": "open"}'::jsonb, '{"status": "in_progress"}'::jsonb);
            """,
            {"actor_id": a["actor"], "entity_type": a["type"], "entity_id": a["id"], "action": a["act"]} if not HAS_PSYCOPG2 else (a["actor"], a["type"], a["id"], a["act"])
        )

    print("\n=======================================================")
    print("SUCCESS: 3-Role Database Seeding Complete!")
    print("Summary of populated records:")
    print("  • Departments: 7")
    print("  • Profiles: 12 (1 Super Admin, 7 Dept Admins, 4 Citizen Users)")
    print("  • User Profile Details: 4")
    print("  • Underlying Issues: 25")
    print("  • Citizen Complaints: 100")
    print("  • Audit Logs: 3")
    print("=======================================================\n")

if __name__ == "__main__":
    conn = get_connection()
    try:
        apply_schema(conn)
        seed_database(conn)
    finally:
        if HAS_PSYCOPG2 and isinstance(conn, psycopg2.extensions.connection):
            conn.close()
        elif HAS_SQLALCHEMY:
            conn.close()
