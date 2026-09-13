# Mini MES – Manufacturing Execution System

A complete, modern, and production-grade **Manufacturing Execution System (Mini MES)** designed for industrial shop floors, discrete manufacturing, and assembly plants (automotive, electronics, plastics, metals, and precision equipment).

Powered by **React.js**, **Tailwind CSS**, **Recharts**, and **Supabase PostgreSQL**.

---

## System Architecture & Workflow

```
Admin or Supervisor creates a work order
              ↓
Work order is assigned to a machine and operator
              ↓
Operator starts production & logs shift quantities
              ↓
Operator records produced and rejected quantities
              ↓
Quality Inspector verifies quality & records defect reasons
              ↓
System automatically updates work order progress and status
              ↓
Supervisor & Plant Manager monitor real-time production from the dashboard
              ↓
Work order transitions to Completed after target is achieved
```

---

## Key Features & Modules

### 1. Real-Time Production Dashboard
- **Live Status KPIs**: Total, Pending, In-Progress, Completed, and Cancelled Work Orders.
- **Quantity Metrics**: Total Planned Quantity, Produced OK, Scrap/Rejected, Remaining Quantity, and Production Completion %.
- **Interactive Visualizations (Recharts)**:
  - Production Output vs Planned by Work Order (Bar Chart).
  - Defect Distribution breakdown by category (Donut Chart).
- **Recent Activity Feed**: Real-time table of recent work orders and production shift entries.
- **Zero Dummy Data**: Clean empty state when no orders exist; 100% powered by live Supabase PostgreSQL queries.

### 2. Work Order Management
- **Full Lifecycle CRUD**: Create, view list, inspect details, edit, and safely delete work orders.
- **Detailed Order Drawer**:
  - Target vs Actuals summary cards.
  - Interactive multi-color progress bar.
  - Linked production shift logs.
  - Linked quality inspection audits.
- **Search & Multi-Filter**: Instant search by WO number, product name, or product code; filter by Status and Priority; sort by date, due date, or target quantity.
- **Business Rule Validations**:
  - Work order number uniqueness check.
  - Planned quantity must be greater than zero.
  - Due date cannot be earlier than start date.
  - Completed or cancelled work orders are locked from receiving new production logs.

### 3. Production Entry & Shift Logging
- **Shift Tracking**: Supports *Shift A (Morning)*, *Shift B (Evening)*, and *Shift C (Night)*.
- **Machine & Operator Assignment**: Selects active work orders, automatically loads assigned equipment and operator.
- **Atomic Quantity Synchronization**:
  - Automatically recalculates `produced_quantity` and `rejected_quantity` on the parent work order.
  - Automatically advances status: `Pending` → `In Progress` → `Completed` (when target is met).
  - Prevents negative quantities and duplicate submissions.

### 4. Quality Inspection & Defect Analysis
- **Automatic Calculation**: `Passed Quantity = Inspected Quantity - Rejected Quantity`.
- **Defect Categorization**:
  - Surface defect (scratches, burrs, pits)
  - Wrong dimension (out of tolerance)
  - Material issue (porosity, inclusions)
  - Machine error (tool chatter, thermal drift)
  - Assembly issue (misaligned pins, loose fasteners)
  - Other
- **Quality Intelligence**: Audited units, Conforming pass rate %, Scrap count, and Defect rate %.

### 5. Machine & Asset Registry
- **Equipment Monitoring**: Operating statuses (`Running`, `Idle`, `Maintenance`, `Offline`).
- **Asset Metadata**: Machine code, name, department, physical shop bay location, last maintenance date, and service remarks.
- **Deletion Safeguard**: Prevents deleting a machine that is currently assigned to an active work order.

### 6. Role-Based Access Control (RBAC) & Testing
- Pre-configured factory personas:
  - **Admin**: Full system management, asset configuration, and data deletion.
  - **Supervisor**: Work order scheduling, machine assignments, and shop-floor monitoring.
  - **Operator**: Production shift output and scrap logging.
  - **Quality Inspector**: Quality sample audits, defect logging, and scrap containment.

---

## Technology Stack

- **Frontend**: React 18, Vite 6, TypeScript
- **Styling**: Tailwind CSS (Dark industrial theme with slate, sky, emerald, amber, and rose accents)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Database & Backend**: Supabase PostgreSQL, official `@supabase/supabase-js` client
- **Security**: Row Level Security (RLS) policies enabled across all tables

---

## Supabase Database Setup

### Step 1: Run the Database Schema
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** on the left menu.
3. Open [`supabase_schema.sql`](file:///c:/Users/vivek/OneDrive/Desktop/Mes/supabase_schema.sql) from this project (or copy it from the in-app assistant under *System & Supabase*).
4. Paste the SQL into the Supabase editor and click **Run**.

This will automatically create:
- `profiles` table
- `machines` table
- `work_orders` table
- `production_entries` table
- `quality_inspections` table
- Performance indexes
- Stored triggers (`recalculate_work_order_totals`)
- Row Level Security (RLS) policies
- Starter seed records for profiles and machines

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` (or configure via the in-app Supabase Setup Assistant):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> **Note**: You can also enter credentials directly in the in-app **Supabase Connection Assistant** modal without restarting the server!

---

## Running Locally

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

The application runs on `http://localhost:5173`.

---

## Verification & Test Checklist

| # | Test Case | Expected Behavior |
|---|---|---|
| 1 | Launch app with clean DB | Displays empty dashboard notice: *"No work orders available. Create your first work order."* |
| 2 | Check Machine Registry | 5 seed machines displayed with statuses (`Running`, `Idle`, `Maintenance`). |
| 3 | Create Work Order | Unique order number validated; target quantity validated > 0; order appears in list. |
| 4 | Assign Machine & Operator | Machine and operator linked properly to work order. |
| 5 | Record Production Entry | Enter shift output (e.g., +50 produced, +2 rejected); order status shifts to `In Progress`; remaining quantity decrements. |
| 6 | Complete Work Order | Enter output reaching total planned quantity; order status automatically shifts to `Completed`. |
| 7 | Attempt entry on Completed WO | Blocked: cannot add production entries to completed or cancelled orders. |
| 8 | Quality Inspection | Sample audit calculation `Passed = Inspected - Rejected` verified; defect reasons logged. |
| 9 | Dashboard Recalculation | Recharts bars and pie charts update live without browser reload. |
| 10 | Delete Machine Safeguard | Attempting to delete a machine assigned to an active order is safely blocked with a descriptive error. |
