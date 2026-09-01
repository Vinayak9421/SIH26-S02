-- SIH26S02 Revised Database Schema (3 Roles Architecture: user, department_admin, super_admin)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 0. Clean old tables if present
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.complaint_status_history CASCADE;
DROP TABLE IF EXISTS public.issue_status_history CASCADE;
DROP TABLE IF EXISTS public.duplicate_relations CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.issues CASCADE;
DROP TABLE IF EXISTS public.user_profile_details CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.demo_users CASCADE;

-- 1. Enum Types
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'department_admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.complaint_status AS ENUM ('pending', 'in_progress', 'resolved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.issue_status AS ENUM ('open', 'in_progress', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.duplicate_state AS ENUM ('none', 'possible', 'linked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category_key TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Profiles Table (Mapped 1:1 to auth.users if Supabase Auth is used, or standalone user record)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    role public.app_role NOT NULL DEFAULT 'user',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT department_admin_requires_department CHECK (
        (role = 'department_admin' AND department_id IS NOT NULL)
        OR (role <> 'department_admin')
    ),
    CONSTRAINT normal_user_has_no_department CHECK (
        (role <> 'user') OR department_id IS NULL
    )
);

-- 4. User Profile Details Table
CREATE TABLE IF NOT EXISTS public.user_profile_details (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    mobile_number TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    city TEXT,
    locality_or_ward TEXT,
    notification_in_app BOOLEAN NOT NULL DEFAULT true,
    notification_email BOOLEAN NOT NULL DEFAULT false,
    default_latitude DOUBLE PRECISION,
    default_longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_default_latitude CHECK (
        default_latitude IS NULL OR default_latitude BETWEEN -90 AND 90
    ),
    CONSTRAINT valid_default_longitude CHECK (
        default_longitude IS NULL OR default_longitude BETWEEN -180 AND 180
    )
);

-- 5. Issues Table (Underlying Civic Problem managed by Department Admin)
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id),
    title TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL,
    representative_embedding vector(384),
    priority public.priority_level NOT NULL DEFAULT 'medium',
    priority_score INTEGER NOT NULL DEFAULT 0 CHECK (priority_score BETWEEN 0 AND 100),
    priority_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    complaint_count INTEGER NOT NULL DEFAULT 0 CHECK (complaint_count >= 0),
    status public.issue_status NOT NULL DEFAULT 'open',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    hotspot_key TEXT,
    ai_confidence NUMERIC,
    needs_human_review BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,

    CONSTRAINT issue_valid_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT issue_valid_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

-- 6. Complaints Table (Citizen Grievance Submissions)
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    text TEXT NOT NULL CHECK (char_length(trim(text)) >= 10),
    normalized_text TEXT,
    language_hint TEXT,
    embedding vector(384),
    ai_category TEXT,
    ai_confidence NUMERIC,
    priority public.priority_level NOT NULL DEFAULT 'medium',
    priority_score INTEGER NOT NULL DEFAULT 0 CHECK (priority_score BETWEEN 0 AND 100),
    priority_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    duplicate_state public.duplicate_state NOT NULL DEFAULT 'none',
    duplicate_of_issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    status public.complaint_status NOT NULL DEFAULT 'pending',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    citizen_visible_note TEXT,
    internal_admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT complaint_valid_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT complaint_valid_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

-- 7. Complaint Status History
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    status public.complaint_status NOT NULL,
    note TEXT,
    visibility TEXT NOT NULL DEFAULT 'user' CHECK (visibility IN ('user', 'department_admin', 'super_admin')),
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Issue Status History
CREATE TABLE IF NOT EXISTS public.issue_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    status public.issue_status NOT NULL,
    note TEXT,
    visibility TEXT NOT NULL DEFAULT 'user' CHECK (visibility IN ('user', 'department_admin', 'super_admin')),
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('profile', 'department', 'complaint', 'issue')),
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS profiles_role_department_idx ON public.profiles (role, department_id);
CREATE INDEX IF NOT EXISTS issues_department_status_priority_idx ON public.issues (department_id, status, priority_score DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS issues_hotspot_idx ON public.issues (hotspot_key) WHERE status <> 'resolved';
CREATE INDEX IF NOT EXISTS complaints_user_created_idx ON public.complaints (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS complaints_issue_idx ON public.complaints (issue_id);
CREATE INDEX IF NOT EXISTS complaints_department_status_idx ON public.complaints (department_id, status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS complaint_history_complaint_idx ON public.complaint_status_history (complaint_id, created_at ASC);
CREATE INDEX IF NOT EXISTS issue_history_issue_idx ON public.issue_status_history (issue_id, created_at ASC);

-- 11. Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS departments_updated_at ON public.departments;
CREATE TRIGGER departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS user_profile_details_updated_at ON public.user_profile_details;
CREATE TRIGGER user_profile_details_updated_at BEFORE UPDATE ON public.user_profile_details FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS issues_updated_at ON public.issues;
CREATE TRIGGER issues_updated_at BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS complaints_updated_at ON public.complaints;
CREATE TRIGGER complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
