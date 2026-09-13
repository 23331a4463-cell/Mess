export type UserRole = 'Admin' | 'Supervisor' | 'Operator' | 'Quality Inspector';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export type MachineStatus = 'Running' | 'Idle' | 'Maintenance' | 'Offline';

export interface Machine {
  id: string;
  machine_code: string;
  machine_name: string;
  department: string;
  status: MachineStatus;
  location?: string | null;
  last_maintenance_date?: string | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type WorkOrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
export type WorkOrderPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface WorkOrder {
  id: string;
  work_order_number: string;
  product_name: string;
  product_code: string;
  planned_quantity: number;
  produced_quantity: number;
  rejected_quantity: number;
  machine_id?: string | null;
  operator_id?: string | null;
  start_date: string;
  due_date: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  remarks?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  floor_rejected_quantity?: number;
  qc_rejected_quantity?: number;
  // Joined relation fields
  machine?: Machine | null;
  operator?: Profile | null;
  creator?: Profile | null;
}

export type ShiftType = 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)';

export interface ProductionEntry {
  id: string;
  work_order_id: string;
  machine_id?: string | null;
  operator_id?: string | null;
  produced_quantity: number;
  rejected_quantity: number;
  shift: ShiftType;
  production_date: string;
  remarks?: string | null;
  created_at?: string;
  // Joined relation fields
  work_order?: WorkOrder | null;
  machine?: Machine | null;
  operator?: Profile | null;
}

export type DefectReason = 
  | 'Surface defect' 
  | 'Wrong dimension' 
  | 'Material issue' 
  | 'Machine error' 
  | 'Assembly issue' 
  | 'Other';

export interface QualityInspection {
  id: string;
  work_order_id: string;
  inspected_quantity: number;
  passed_quantity: number;
  rejected_quantity: number;
  defect_reason?: DefectReason | null;
  inspector_id?: string | null;
  inspection_date: string;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined relation fields
  work_order?: WorkOrder | null;
  inspector?: Profile | null;
}

export interface DashboardMetrics {
  totalWorkOrders: number;
  pendingWorkOrders: number;
  inProgressWorkOrders: number;
  completedWorkOrders: number;
  cancelledWorkOrders: number;
  totalPlannedQuantity: number;
  totalProducedQuantity: number;
  totalRejectedQuantity: number;
  totalFloorRejectedQuantity?: number;
  totalQcRejectedQuantity?: number;
  totalRemainingQuantity: number;
  completionPercentage: number;
  overallRejectionRate: number;
}
