-- ==============================================================================
-- Mini MES (Manufacturing Execution System) - Supabase PostgreSQL Database Schema
-- With Role-Based Access Control (RBAC), Triggers & Strict Security
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CLEAN RESET (Drops legacy tables & triggers to guarantee clean schema & avoid deadlocks)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_production_entries_sync ON public.production_entries;
DROP TRIGGER IF EXISTS trg_quality_inspections_sync ON public.quality_inspections;
DROP TABLE IF EXISTS public.quality_inspections CASCADE;
DROP TABLE IF EXISTS public.production_entries CASCADE;
DROP TABLE IF EXISTS public.work_orders CASCADE;
DROP TABLE IF EXISTS public.machines CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. PROFILES TABLE
-- Linked directly to Supabase Auth users (auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Supervisor', 'Operator', 'Quality Inspector')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MACHINES TABLE
-- Tracks factory equipment and operating statuses
CREATE TABLE IF NOT EXISTS public.machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_code TEXT UNIQUE NOT NULL,
    machine_name TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Idle' CHECK (status IN ('Running', 'Idle', 'Maintenance', 'Offline')),
    location TEXT,
    last_maintenance_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. WORK ORDERS TABLE
-- Central manufacturing orders tracking target vs actuals
CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_number TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    product_code TEXT NOT NULL,
    planned_quantity INTEGER NOT NULL CHECK (planned_quantity > 0),
    produced_quantity INTEGER NOT NULL DEFAULT 0 CHECK (produced_quantity >= 0),
    rejected_quantity INTEGER NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
    machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    remarks TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_due_date_after_start CHECK (due_date >= start_date)
);

-- 5. PRODUCTION ENTRIES TABLE
-- Logs shift production and floor scrap counts per work order
CREATE TABLE IF NOT EXISTS public.production_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    produced_quantity INTEGER NOT NULL CHECK (produced_quantity >= 0),
    rejected_quantity INTEGER NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
    shift TEXT NOT NULL CHECK (shift IN ('Shift A (Morning)', 'Shift B (Evening)', 'Shift C (Night)')),
    production_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. QUALITY INSPECTIONS TABLE
-- Verification and defect tracking by QC inspectors
CREATE TABLE IF NOT EXISTS public.quality_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    inspected_quantity INTEGER NOT NULL CHECK (inspected_quantity > 0),
    passed_quantity INTEGER NOT NULL CHECK (passed_quantity >= 0),
    rejected_quantity INTEGER NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
    defect_reason TEXT CHECK (defect_reason IN ('Surface defect', 'Wrong dimension', 'Material issue', 'Machine error', 'Assembly issue', 'Other')),
    inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_passed_calc CHECK (passed_quantity = inspected_quantity - rejected_quantity),
    CONSTRAINT chk_rejected_not_exceed CHECK (rejected_quantity <= inspected_quantity)
);

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS idx_wo_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_wo_machine ON public.work_orders(machine_id);
CREATE INDEX IF NOT EXISTS idx_wo_operator ON public.work_orders(operator_id);
CREATE INDEX IF NOT EXISTS idx_pe_work_order ON public.production_entries(work_order_id);
CREATE INDEX IF NOT EXISTS idx_pe_date ON public.production_entries(production_date);
CREATE INDEX IF NOT EXISTS idx_qi_work_order ON public.quality_inspections(work_order_id);

-- 8. AUTH TRIGGER: AUTO-CREATE PROFILE ON AUTH.USERS INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'Operator')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. SECURITY DEFINER HELPER: GET CURRENT USER ROLE
-- Avoids recursive RLS evaluation when checking user permissions
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 10. WORKFLOW TRIGGERS & RECALCULATION
-- SINGLE SOURCE OF TRUTH: Work order status transition to 'Completed' is strictly based on
-- produced_quantity >= planned_quantity (conforming good units only).
-- Total rejected quantity combines both floor scrap (production_entries) and QC defects (quality_inspections).
CREATE OR REPLACE FUNCTION public.recalculate_work_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    target_wo_id UUID;
    total_produced INTEGER := 0;
    floor_rejected INTEGER := 0;
    qc_rejected INTEGER := 0;
    total_rejected INTEGER := 0;
    current_planned INTEGER := 0;
    current_status TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_wo_id := OLD.work_order_id;
    ELSE
        target_wo_id := NEW.work_order_id;
    END IF;

    -- Fetch planned target and current status
    SELECT planned_quantity, status 
    INTO current_planned, current_status
    FROM public.work_orders
    WHERE id = target_wo_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Aggregate production output and floor rejects
    SELECT 
        COALESCE(SUM(produced_quantity), 0),
        COALESCE(SUM(rejected_quantity), 0)
    INTO 
        total_produced,
        floor_rejected
    FROM public.production_entries
    WHERE work_order_id = target_wo_id;

    -- Aggregate QC rejected defect units
    SELECT 
        COALESCE(SUM(rejected_quantity), 0)
    INTO 
        qc_rejected
    FROM public.quality_inspections
    WHERE work_order_id = target_wo_id;

    total_rejected := floor_rejected + qc_rejected;

    -- Defense-in-depth: ensure production entries do not exceed planned targets
    IF (total_produced + total_rejected) > current_planned THEN
        RAISE EXCEPTION 'Total output (% units) would exceed planned quantity (% units)', (total_produced + total_rejected), current_planned;
    END IF;

    -- Determine new status if not manually cancelled
    -- SINGLE SOURCE OF TRUTH: only good produced units count toward target completion
    IF current_status != 'Cancelled' THEN
        IF total_produced >= current_planned THEN
            current_status := 'Completed';
        ELSIF total_produced > 0 THEN
            current_status := 'In Progress';
        ELSE
            current_status := 'Pending';
        END IF;
    END IF;

    -- Update work order record
    UPDATE public.work_orders
    SET 
        produced_quantity = total_produced,
        rejected_quantity = total_rejected,
        status = current_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_wo_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger on production_entries
DROP TRIGGER IF EXISTS trg_recalculate_work_order ON public.production_entries;
CREATE TRIGGER trg_recalculate_work_order
AFTER INSERT OR UPDATE OR DELETE ON public.production_entries
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_work_order_totals();

-- Trigger on quality_inspections (so QC defects immediately update work order)
DROP TRIGGER IF EXISTS trg_recalculate_work_order_qc ON public.quality_inspections;
CREATE TRIGGER trg_recalculate_work_order_qc
AFTER INSERT OR UPDATE OR DELETE ON public.quality_inspections
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_work_order_totals();

-- Automated timestamp updater
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_machines_updated_at ON public.machines;
CREATE TRIGGER trg_machines_updated_at
BEFORE UPDATE ON public.machines
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER trg_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_quality_inspections_updated_at ON public.quality_inspections;
CREATE TRIGGER trg_quality_inspections_updated_at
BEFORE UPDATE ON public.quality_inspections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 11. ROW LEVEL SECURITY (RLS) - ROLE-AWARE POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- PROFILES POLICIES
-- All authenticated users can read profiles; users can only update their own profile
CREATE POLICY "profiles_select_auth" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- MACHINES POLICIES
-- All authenticated users can view machines; Admins & Supervisors can manage
CREATE POLICY "machines_select_auth" ON public.machines
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "machines_manage_admin_supervisor" ON public.machines
    FOR ALL TO authenticated
    USING (public.get_my_role() IN ('Admin', 'Supervisor'))
    WITH CHECK (public.get_my_role() IN ('Admin', 'Supervisor'));

-- WORK ORDERS POLICIES
-- All authenticated users can view; Admins & Supervisors can insert/update; only Admin can delete
CREATE POLICY "work_orders_select_auth" ON public.work_orders
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "work_orders_insert_update" ON public.work_orders
    FOR INSERT TO authenticated
    WITH CHECK (public.get_my_role() IN ('Admin', 'Supervisor'));

CREATE POLICY "work_orders_update" ON public.work_orders
    FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('Admin', 'Supervisor'))
    WITH CHECK (public.get_my_role() IN ('Admin', 'Supervisor'));

CREATE POLICY "work_orders_delete_admin" ON public.work_orders
    FOR DELETE TO authenticated
    USING (public.get_my_role() = 'Admin');

-- PRODUCTION ENTRIES POLICIES
-- All authenticated users can view; Operators, Supervisors & Admins can insert; Admin & Supervisor can delete
CREATE POLICY "production_entries_select_auth" ON public.production_entries
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "production_entries_insert_operator" ON public.production_entries
    FOR INSERT TO authenticated
    WITH CHECK (public.get_my_role() IN ('Admin', 'Supervisor', 'Operator'));

CREATE POLICY "production_entries_delete_supervisor_admin" ON public.production_entries
    FOR DELETE TO authenticated
    USING (public.get_my_role() IN ('Admin', 'Supervisor'));

-- QUALITY INSPECTIONS POLICIES
-- All authenticated users can view; Inspectors, Supervisors & Admins can insert/update; only Admin can delete
CREATE POLICY "quality_inspections_select_auth" ON public.quality_inspections
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "quality_inspections_insert_update" ON public.quality_inspections
    FOR INSERT TO authenticated
    WITH CHECK (public.get_my_role() IN ('Admin', 'Supervisor', 'Quality Inspector'));

CREATE POLICY "quality_inspections_update" ON public.quality_inspections
    FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('Admin', 'Supervisor', 'Quality Inspector'))
    WITH CHECK (public.get_my_role() IN ('Admin', 'Supervisor', 'Quality Inspector'));

CREATE POLICY "quality_inspections_delete_admin" ON public.quality_inspections
    FOR DELETE TO authenticated
    USING (public.get_my_role() = 'Admin');

-- 12. SAMPLE SEED MACHINES (Idempotent)
INSERT INTO public.machines (id, machine_code, machine_name, department, status, location, last_maintenance_date, remarks)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CNC-01', 'HAAS VF-4 CNC Milling', 'Machining', 'Running', 'Bay A - Station 04', CURRENT_DATE - INTERVAL '12 days', 'High-speed spindle serviced'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PRS-02', 'AIDA 200T Stamping Press', 'Forming', 'Running', 'Bay B - Press Row 2', CURRENT_DATE - INTERVAL '30 days', 'Die alignment verified'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'INJ-05', 'Engel 150T Injection Molder', 'Molding', 'Idle', 'Bay C - Polymer Wing', CURRENT_DATE - INTERVAL '5 days', 'Mold sanitized'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'SMT-01', 'Yamaha YSM20R SMT Pick & Place', 'Electronics', 'Running', 'Cleanroom Line 1', CURRENT_DATE - INTERVAL '8 days', 'Feeder calibration passed'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ROB-03', 'KUKA KR-16 Robotic Welder', 'Fabrication', 'Maintenance', 'Bay D - Welding Cell', CURRENT_DATE - INTERVAL '1 day', 'Scheduled torch tip replacement')
ON CONFLICT (machine_code) DO NOTHING;
