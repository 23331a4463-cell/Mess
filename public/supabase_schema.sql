-- ==============================================================================
-- Mini MES (Manufacturing Execution System) - Supabase PostgreSQL Database Schema
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Supervisor', 'Operator', 'Quality Inspector')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MACHINES TABLE
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

-- 8. TRIGGER RECALCULATION
CREATE OR REPLACE FUNCTION public.recalculate_work_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    target_wo_id UUID;
    total_produced INTEGER;
    total_rejected INTEGER;
    current_planned INTEGER;
    current_status TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_wo_id := OLD.work_order_id;
    ELSE
        target_wo_id := NEW.work_order_id;
    END IF;

    SELECT 
        COALESCE(SUM(produced_quantity), 0),
        COALESCE(SUM(rejected_quantity), 0)
    INTO 
        total_produced,
        total_rejected
    FROM public.production_entries
    WHERE work_order_id = target_wo_id;

    SELECT planned_quantity, status 
    INTO current_planned, current_status
    FROM public.work_orders
    WHERE id = target_wo_id;

    IF current_status != 'Cancelled' THEN
        IF total_produced >= current_planned THEN
            current_status := 'Completed';
        ELSIF total_produced > 0 THEN
            current_status := 'In Progress';
        ELSE
            current_status := 'Pending';
        END IF;
    END IF;

    UPDATE public.work_orders
    SET 
        produced_quantity = total_produced,
        rejected_quantity = total_rejected,
        status = current_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_wo_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_work_order ON public.production_entries;
CREATE TRIGGER trg_recalculate_work_order
AFTER INSERT OR UPDATE OR DELETE ON public.production_entries
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_work_order_totals();

-- Automated updated_at
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

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow select for all" ON public.machines FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.machines FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.machines FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON public.machines FOR DELETE USING (true);

CREATE POLICY "Allow select for all" ON public.work_orders FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.work_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.work_orders FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON public.work_orders FOR DELETE USING (true);

CREATE POLICY "Allow select for all" ON public.production_entries FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.production_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.production_entries FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON public.production_entries FOR DELETE USING (true);

CREATE POLICY "Allow select for all" ON public.quality_inspections FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.quality_inspections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.quality_inspections FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON public.quality_inspections FOR DELETE USING (true);

-- 10. SAMPLE SEED DATA
INSERT INTO public.profiles (id, full_name, email, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Alex Mercer (Supervisor)', 'alex.mercer@factory.internal', 'Supervisor'),
    ('22222222-2222-2222-2222-222222222222', 'David Chen (Lead Operator)', 'david.chen@factory.internal', 'Operator'),
    ('33333333-3333-3333-3333-333333333333', 'Elena Rodriguez (Quality Inspector)', 'elena.rodriguez@factory.internal', 'Quality Inspector'),
    ('44444444-4444-4444-4444-444444444444', 'Marcus Vance (Plant Admin)', 'marcus.vance@factory.internal', 'Admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.machines (id, machine_code, machine_name, department, status, location, last_maintenance_date, remarks)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CNC-01', 'HAAS VF-4 CNC Milling', 'Machining', 'Running', 'Bay A - Station 04', CURRENT_DATE - INTERVAL '12 days', 'High-speed spindle serviced'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PRS-02', 'AIDA 200T Stamping Press', 'Forming', 'Running', 'Bay B - Press Row 2', CURRENT_DATE - INTERVAL '30 days', 'Die alignment verified'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'INJ-05', 'Engel 150T Injection Molder', 'Molding', 'Idle', 'Bay C - Polymer Wing', CURRENT_DATE - INTERVAL '5 days', 'Mold sanitized'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'SMT-01', 'Yamaha YSM20R SMT Pick & Place', 'Electronics', 'Running', 'Cleanroom Line 1', CURRENT_DATE - INTERVAL '8 days', 'Feeder calibration passed'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ROB-03', 'KUKA KR-16 Robotic Welder', 'Fabrication', 'Maintenance', 'Bay D - Welding Cell', CURRENT_DATE - INTERVAL '1 day', 'Scheduled torch tip replacement')
ON CONFLICT (machine_code) DO NOTHING;
