# Mini MES – Manufacturing Execution System

A complete, modern, and production-grade **Manufacturing Execution System (Mini MES)** designed for industrial shop floors, discrete manufacturing, and assembly plants (automotive, electronics, plastics, metals, and precision equipment).

Powered by **React.js**, **Tailwind CSS**, **Recharts**, and **Supabase PostgreSQL** with real **Supabase Auth** and **Row Level Security (RLS)** enforcement.

---

## Industrial HMI Control-Room Interface

The interface is modeled after modern industrial Human-Machine Interface (HMI) control systems:
- **Telemetry Typography**: Monospaced font (*JetBrains Mono*) for work order identifiers, machine codes, batch numbers, timestamps, and quantities.
- **Control-Room Palette**: Deep slate background (`slate-950` / `slate-900`) with high-contrast borders and status colors (sky, emerald, amber, rose, violet).
- **Live Status Beacons**: Pulsing status indicators for running equipment and active production runs.
- **Subtle Surface Grid**: 24px industrial grid texture reflecting digital shop-floor dashboards.

---

## System Architecture & Workflow

```
Admin or Supervisor creates a work order (Planned Quantity Target)
                        ↓
Work order is assigned to an active machine and operator
                        ↓
Operator signs in and logs shift production & scrap
(Planned Quantity Cap: Produced + Rejected ≤ Planned Target)
                        ↓
Quality Inspector logs audit sample & defects (Surface, Dimension, Material, etc.)
                        ↓
Both Floor Scrap and QC Defects automatically aggregate into Work Order totals
                        ↓
Progress & Completion % are computed strictly as:
Completion % = (produced_quantity / planned_quantity) * 100
                        ↓
When produced_quantity ≥ planned_quantity, status transitions to "Completed"
                        ↓
PostgreSQL Row Level Security (RLS) protects all data operations at the database layer
```

---

## Authentication & Role-Based Access Control (RBAC)

The system enforces real authentication via **Supabase Auth**. Users log in with work credentials, their role is resolved directly from `public.profiles` linked to `auth.users(id)`, and permissions are enforced at the database level via PostgreSQL Row Level Security (RLS).

### Security Architecture

- **`profiles.id REFERENCES auth.users(id) ON DELETE CASCADE`**: Direct 1:1 foreign key binding.
- **`handle_new_user()` Database Trigger**: Automatically provisions a corresponding `public.profiles` row whenever a user is created in Supabase Auth.
- **`get_my_role()` Function (`SECURITY DEFINER STABLE`)**: Securely resolves the calling user's role in RLS policies without recursive table lookups or client tampering.
- **No Manual Role Overrides**: Role switching and "view-as" modes are strictly disallowed in the UI.

### Factory Personas & Permissions Matrix

| Module / Action | Admin | Supervisor | Operator | Quality Inspector |
|---|:---:|:---:|:---:|:---:|
| **View Dashboard & Analytics** | ✓ | ✓ | ✓ | ✓ |
| **Create & Edit Work Orders** | ✓ | ✓ | — | — |
| **Delete Work Orders** | ✓ | — | — | — |
| **Manage Factory Machines** | ✓ | — | — | — |
| **Record Shift Production** | ✓ | ✓ | ✓ | — |
| **Delete Production Logs** | ✓ | — | — | — |
| **Log Quality Inspections** | ✓ | ✓ | — | ✓ |
| **Delete Quality Audits** | ✓ | — | — | — |

---

## Seed Users Reference (Development & Testing)

> [!NOTE]
> The seed user credentials below are intended for development and automated testing only. They are not exposed in the application UI.

| Role | Email | Password | Full Name |
|---|---|---|---|
| **Admin** | `admin@factory.com` | `Admin#123!` | Plant Administrator |
| **Supervisor** | `supervisor@factory.com` | `Super#123!` | Production Supervisor |
| **Operator** | `operator@factory.com` | `Oper#123!` | Senior Machine Operator |
| **Quality Inspector** | `quality@factory.com` | `Quality#123!` | Quality Assurance Lead |

---

## Setup & Deployment Guide

### Step 1: Run the Database Schema in Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor** tab.
3. Open [`supabase_schema.sql`](file:///c:/Users/vivek/OneDrive/Desktop/Mes/supabase_schema.sql) in this repository.
4. Copy the entire file, paste it into the Supabase SQL editor, and click **Run**.

This script sets up:
- The `profiles`, `machines`, `work_orders`, `production_entries`, and `quality_inspections` tables.
- Foreign keys linked to `auth.users`.
- The `handle_new_user()` trigger for automated profile generation.
- The `get_my_role()` helper function.
- Multi-table quantity synchronization triggers enforcing the planned quantity cap.
- Role-based Row Level Security (RLS) policies.
- 5 default production machines.

### Step 2: Provision Seed Authentication Accounts

Run the provisioning script using your Supabase project's `service_role` key (found under *Project Settings → API* in Supabase Dashboard):

```bash
# Set your environment variables
set SUPABASE_URL=https://your-project-id.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Execute the provisioning script
node scripts/seed-users.js
```

This script provisions and pre-confirms all 4 demo users (`admin@factory.com`, `supervisor@factory.com`, `operator@factory.com`, and `quality@factory.com`) with matching profiles.

### Step 3: Configure Frontend Environment Variables

Create or update `.env` in the root directory:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Step 4: Run the Application Locally

```bash
# Install project dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will be running at `http://localhost:5173`.

---

## Key Modules & Logic Rules

### 1. Reconciled Status vs. Completion %
- **Completion %**: Computed strictly as `(produced_quantity / planned_quantity) * 100`.
- **Status "Completed"**: Automatically marked when `produced_quantity >= planned_quantity`.
- Good units alone count towards completing the order; scrap and rejected parts do not count toward achieving the planned target.

### 2. Planned Quantity Cap
- Production entries enforce: `(existing_produced + new_produced) + (existing_rejected + new_rejected) <= planned_quantity`.
- If an operator attempts to log an entry that would cause total parts to exceed the planned limit, the submission is rejected with an explanatory message:
  `"This entry would exceed the planned quantity of X by Y units."`
- Defense-in-depth: This cap is validated both in client form logic and via PostgreSQL triggers.

### 3. Integrated Quality Inspections
- Quality inspections update the work order's rejected totals and remaining counts upon creation, update, or deletion.
- The Dashboard and Work Order Detail views present a clear breakdown between:
  - **Floor Scrap**: Defective parts rejected during shift production.
  - **QC Defects**: Defective parts discovered during quality inspection audits.

---

## Verification & Test Checklist

| # | Test Scenario | Steps | Expected Outcome |
|---|---|---|---|
| **0** | **Authentication Gate** | Open application without active session | Redirects to industrial login screen; dashboard and sidebar are inaccessible until login. |
| **1** | **Role Login (Operator)** | Log in as `operator@factory.com` | Navbar displays Operator badge; "Create Work Order" and "Add Machine" buttons are hidden; Settings displays read-only RBAC matrix. |
| **2** | **Role Login (Supervisor)** | Log in as `supervisor@factory.com` | Work order creation/editing enabled; machine management restricted to view-only. |
| **3** | **Role Login (Admin)** | Log in as `admin@factory.com` | Full administrative control enabled (work orders, shift logs, machines, deletions). |
| **4** | **Create Work Order** | Log in as Supervisor, create WO with Target = 100 | Order appears with 0% progress and `Pending` status. |
| **5** | **Shift Production & Cap Validation** | Log in as Operator, enter +50 Produced, +5 Rejected | Status advances to `In Progress`; completion is 50%; remaining is 50. |
| **6** | **Exceed Planned Quantity** | Attempt to log +50 Produced + 10 Rejected on above order | Blocked with message: *"This entry would exceed the planned quantity of 100 by 15 units."* |
| **7** | **Quality Inspection Linkage** | Log in as Quality Inspector, record inspection with 5 defects | Work order detail shows separate breakdown: Floor Scrap: 5, QC Defects: 5. Total Rejects: 10. |
| **8** | **Work Order Completion** | Log remaining 50 good units | Status automatically advances to `Completed`; Completion is 100%. |
| **9** | **RLS Direct API Defense** | Attempt direct Supabase API delete from Operator session | Database returns PostgreSQL RLS policy violation (`42501 permission denied`). |
| **10** | **Sign Out** | Click Sign Out in Navbar or Settings | Session destroyed, returns cleanly to the login screen. |
