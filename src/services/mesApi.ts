import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  WorkOrder, 
  Machine, 
  Profile, 
  ProductionEntry, 
  QualityInspection, 
  DashboardMetrics,
  DefectReason
} from '../types';

export const mesApi = {
  // ==========================================
  // PROFILES
  // ==========================================
  async getProfiles(): Promise<Profile[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createProfile(profile: Omit<Profile, 'id' | 'created_at'>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // ==========================================
  // MACHINES
  // ==========================================
  async getMachines(): Promise<Machine[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('machine_code', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createMachine(machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>): Promise<Machine> {
    const { data, error } = await supabase
      .from('machines')
      .insert([machine])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Machine Code "${machine.machine_code}" already exists. Please use a unique code.`);
      }
      throw new Error(error.message);
    }
    return data;
  },

  async updateMachine(id: string, updates: Partial<Machine>): Promise<Machine> {
    const { data, error } = await supabase
      .from('machines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteMachine(id: string): Promise<void> {
    // Safety check: Cannot delete a machine assigned to an active work order
    const { data: activeOrders, error: checkError } = await supabase
      .from('work_orders')
      .select('work_order_number, status')
      .eq('machine_id', id)
      .in('status', ['Pending', 'In Progress']);

    if (checkError) throw new Error(checkError.message);

    if (activeOrders && activeOrders.length > 0) {
      const activeCodes = activeOrders.map(o => o.work_order_number).join(', ');
      throw new Error(`Cannot delete machine. It is currently assigned to active work order(s): ${activeCodes}. Reassign or complete those work orders first.`);
    }

    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ==========================================
  // WORK ORDERS
  // ==========================================
  async getWorkOrders(): Promise<WorkOrder[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        machine:machines(*),
        operator:profiles!work_orders_operator_id_fkey(*),
        creator:profiles!work_orders_created_by_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      // If foreign keys aren't named explicitly in Supabase, fallback to simpler join
      const fallback = await supabase
        .from('work_orders')
        .select(`*, machine:machines(*)`)
        .order('created_at', { ascending: false });
      if (fallback.error) throw new Error(fallback.error.message);
      return fallback.data || [];
    }
    return data || [];
  },

  async getWorkOrderById(id: string): Promise<{
    workOrder: WorkOrder;
    productionEntries: ProductionEntry[];
    inspections: QualityInspection[];
  }> {
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select(`
        *,
        machine:machines(*),
        operator:profiles!work_orders_operator_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (woError) throw new Error(woError.message);

    const [prodRes, qcRes] = await Promise.all([
      supabase
        .from('production_entries')
        .select(`*, operator:profiles(*)`)
        .eq('work_order_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('quality_inspections')
        .select(`*, inspector:profiles(*)`)
        .eq('work_order_id', id)
        .order('created_at', { ascending: false })
    ]);

    return {
      workOrder: woData,
      productionEntries: prodRes.data || [],
      inspections: qcRes.data || []
    };
  },

  async createWorkOrder(order: {
    work_order_number: string;
    product_name: string;
    product_code: string;
    planned_quantity: number;
    machine_id?: string | null;
    operator_id?: string | null;
    start_date: string;
    due_date: string;
    priority: string;
    status?: string;
    remarks?: string | null;
    created_by?: string | null;
  }): Promise<WorkOrder> {
    // Validation
    if (order.planned_quantity <= 0) {
      throw new Error('Planned quantity must be greater than zero.');
    }
    if (new Date(order.due_date) < new Date(order.start_date)) {
      throw new Error('Due date cannot be earlier than start date.');
    }

    const { data, error } = await supabase
      .from('work_orders')
      .insert([{
        ...order,
        produced_quantity: 0,
        rejected_quantity: 0,
        status: order.status || 'Pending'
      }])
      .select(`*, machine:machines(*)`)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Work Order Number "${order.work_order_number}" already exists. Please use a unique number.`);
      }
      throw new Error(error.message);
    }
    return data;
  },

  async updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder> {
    if (updates.planned_quantity !== undefined && updates.planned_quantity <= 0) {
      throw new Error('Planned quantity must be greater than zero.');
    }
    if (updates.start_date && updates.due_date && new Date(updates.due_date) < new Date(updates.start_date)) {
      throw new Error('Due date cannot be earlier than start date.');
    }

    // Clean payload of nested objects
    const cleanUpdates = { ...updates };
    delete cleanUpdates.machine;
    delete cleanUpdates.operator;
    delete cleanUpdates.creator;

    const { data, error } = await supabase
      .from('work_orders')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`*, machine:machines(*)`)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteWorkOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ==========================================
  // PRODUCTION ENTRIES
  // ==========================================
  async getProductionEntries(limit = 50): Promise<ProductionEntry[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('production_entries')
      .select(`
        *,
        work_order:work_orders(id, work_order_number, product_name, product_code, status, planned_quantity),
        machine:machines(id, machine_code, machine_name),
        operator:profiles(id, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createProductionEntry(entry: {
    work_order_id: string;
    machine_id?: string | null;
    operator_id?: string | null;
    produced_quantity: number;
    rejected_quantity: number;
    shift: string;
    production_date: string;
    remarks?: string | null;
  }): Promise<ProductionEntry> {
    // 1. Fetch current work order
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('*')
      .eq('id', entry.work_order_id)
      .single();

    if (woError || !wo) {
      throw new Error('Selected Work Order does not exist.');
    }

    // 2. Validate Work Order status
    if (wo.status === 'Completed') {
      throw new Error('Cannot add production entry: This work order is already Completed.');
    }
    if (wo.status === 'Cancelled') {
      throw new Error('Cannot add production entry: This work order is Cancelled.');
    }

    // 3. Validate quantities
    if (entry.produced_quantity < 0) {
      throw new Error('Produced quantity cannot be negative.');
    }
    if (entry.rejected_quantity < 0) {
      throw new Error('Rejected quantity cannot be negative.');
    }
    if (entry.produced_quantity === 0 && entry.rejected_quantity === 0) {
      throw new Error('At least produced quantity or rejected quantity must be greater than zero.');
    }

    // 4. Insert entry
    const { data: newEntry, error: insertError } = await supabase
      .from('production_entries')
      .insert([entry])
      .select(`
        *,
        work_order:work_orders(*),
        machine:machines(*)
      `)
      .single();

    if (insertError) throw new Error(insertError.message);

    // 5. Update work order totals (guarantees consistency if triggers are not active)
    await this.syncWorkOrderQuantities(entry.work_order_id);

    return newEntry;
  },

  async deleteProductionEntry(id: string, workOrderId: string): Promise<void> {
    const { error } = await supabase
      .from('production_entries')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    await this.syncWorkOrderQuantities(workOrderId);
  },

  // Recalculate and synchronize work order produced & rejected quantities
  async syncWorkOrderQuantities(workOrderId: string): Promise<void> {
    const { data: entries, error: entriesError } = await supabase
      .from('production_entries')
      .select('produced_quantity, rejected_quantity')
      .eq('work_order_id', workOrderId);

    if (entriesError) return;

    const totalProduced = (entries || []).reduce((acc, curr) => acc + (curr.produced_quantity || 0), 0);
    const totalRejected = (entries || []).reduce((acc, curr) => acc + (curr.rejected_quantity || 0), 0);

    const { data: wo } = await supabase
      .from('work_orders')
      .select('planned_quantity, status')
      .eq('id', workOrderId)
      .single();

    if (!wo) return;

    let newStatus = wo.status;
    if (wo.status !== 'Cancelled') {
      if (totalProduced >= wo.planned_quantity) {
        newStatus = 'Completed';
      } else if (totalProduced > 0) {
        newStatus = 'In Progress';
      } else {
        newStatus = 'Pending';
      }
    }

    await supabase
      .from('work_orders')
      .update({
        produced_quantity: totalProduced,
        rejected_quantity: totalRejected,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', workOrderId);
  },

  // ==========================================
  // QUALITY INSPECTIONS
  // ==========================================
  async getQualityInspections(limit = 50): Promise<QualityInspection[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('quality_inspections')
      .select(`
        *,
        work_order:work_orders(id, work_order_number, product_name, product_code),
        inspector:profiles(id, full_name)
      `)
      .order('inspection_date', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createQualityInspection(inspection: {
    work_order_id: string;
    inspected_quantity: number;
    rejected_quantity: number;
    defect_reason?: DefectReason | null;
    inspector_id?: string | null;
    inspection_date: string;
    remarks?: string | null;
  }): Promise<QualityInspection> {
    if (inspection.inspected_quantity <= 0) {
      throw new Error('Inspected quantity must be greater than zero.');
    }
    if (inspection.rejected_quantity < 0) {
      throw new Error('Rejected quantity cannot be negative.');
    }
    if (inspection.rejected_quantity > inspection.inspected_quantity) {
      throw new Error('Rejected quantity cannot exceed inspected quantity.');
    }

    const passedQuantity = inspection.inspected_quantity - inspection.rejected_quantity;

    const { data, error } = await supabase
      .from('quality_inspections')
      .insert([{
        ...inspection,
        passed_quantity: passedQuantity
      }])
      .select(`
        *,
        work_order:work_orders(id, work_order_number, product_name),
        inspector:profiles(id, full_name)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateQualityInspection(id: string, updates: Partial<QualityInspection>): Promise<QualityInspection> {
    if (updates.inspected_quantity !== undefined && updates.inspected_quantity <= 0) {
      throw new Error('Inspected quantity must be greater than zero.');
    }
    if (updates.rejected_quantity !== undefined && updates.rejected_quantity < 0) {
      throw new Error('Rejected quantity cannot be negative.');
    }

    const payload = { ...updates };
    delete payload.work_order;
    delete payload.inspector;

    if (payload.inspected_quantity !== undefined && payload.rejected_quantity !== undefined) {
      if (payload.rejected_quantity > payload.inspected_quantity) {
        throw new Error('Rejected quantity cannot exceed inspected quantity.');
      }
      payload.passed_quantity = payload.inspected_quantity - payload.rejected_quantity;
    }

    const { data, error } = await supabase
      .from('quality_inspections')
      .update(payload)
      .eq('id', id)
      .select(`*, work_order:work_orders(*), inspector:profiles(*)`)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteQualityInspection(id: string): Promise<void> {
    const { error } = await supabase
      .from('quality_inspections')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ==========================================
  // DASHBOARD METRICS & CHARTS
  // ==========================================
  async getDashboardMetrics(): Promise<{
    metrics: DashboardMetrics;
    recentWorkOrders: WorkOrder[];
    recentEntries: ProductionEntry[];
    productionSummaryChart: { name: string; planned: number; produced: number; remaining: number }[];
    defectSummaryChart: { name: string; value: number }[];
  }> {
    if (!isSupabaseConfigured) {
      return {
        metrics: {
          totalWorkOrders: 0,
          pendingWorkOrders: 0,
          inProgressWorkOrders: 0,
          completedWorkOrders: 0,
          cancelledWorkOrders: 0,
          totalPlannedQuantity: 0,
          totalProducedQuantity: 0,
          totalRejectedQuantity: 0,
          totalRemainingQuantity: 0,
          completionPercentage: 0,
          overallRejectionRate: 0
        },
        recentWorkOrders: [],
        recentEntries: [],
        productionSummaryChart: [],
        defectSummaryChart: []
      };
    }

    const [woRes, entriesRes, qcRes] = await Promise.all([
      supabase.from('work_orders').select('*, machine:machines(*)').order('created_at', { ascending: false }),
      supabase.from('production_entries').select('*, work_order:work_orders(work_order_number, product_name), machine:machines(machine_code)').order('created_at', { ascending: false }).limit(6),
      supabase.from('quality_inspections').select('*')
    ]);

    const workOrders: WorkOrder[] = woRes.data || [];
    const recentEntries: ProductionEntry[] = entriesRes.data || [];
    const inspections: QualityInspection[] = qcRes.data || [];

    const totalWorkOrders = workOrders.length;
    const pendingWorkOrders = workOrders.filter(w => w.status === 'Pending').length;
    const inProgressWorkOrders = workOrders.filter(w => w.status === 'In Progress').length;
    const completedWorkOrders = workOrders.filter(w => w.status === 'Completed').length;
    const cancelledWorkOrders = workOrders.filter(w => w.status === 'Cancelled').length;

    const totalPlannedQuantity = workOrders.reduce((sum, w) => sum + (w.planned_quantity || 0), 0);
    const totalProducedQuantity = workOrders.reduce((sum, w) => sum + (w.produced_quantity || 0), 0);
    const totalRejectedQuantity = workOrders.reduce((sum, w) => sum + (w.rejected_quantity || 0), 0);
    const totalRemainingQuantity = Math.max(0, totalPlannedQuantity - totalProducedQuantity - totalRejectedQuantity);

    const completionPercentage = totalPlannedQuantity > 0
      ? Math.min(100, Math.round(((totalProducedQuantity + totalRejectedQuantity) / totalPlannedQuantity) * 100))
      : 0;

    const totalInspected = inspections.reduce((sum, q) => sum + (q.inspected_quantity || 0), 0);
    const totalQcRejected = inspections.reduce((sum, q) => sum + (q.rejected_quantity || 0), 0);
    const overallRejectionRate = totalInspected > 0
      ? Math.round((totalQcRejected / totalInspected) * 1000) / 10
      : 0;

    // Production summary chart (top 6 work orders)
    const productionSummaryChart = workOrders.slice(0, 6).map(w => ({
      name: w.work_order_number,
      planned: w.planned_quantity,
      produced: w.produced_quantity,
      remaining: Math.max(0, w.planned_quantity - w.produced_quantity - w.rejected_quantity)
    }));

    // Defect summary chart
    const defectMap: Record<string, number> = {};
    inspections.forEach(i => {
      if (i.defect_reason && i.rejected_quantity > 0) {
        defectMap[i.defect_reason] = (defectMap[i.defect_reason] || 0) + i.rejected_quantity;
      }
    });

    const defectSummaryChart = Object.keys(defectMap).map(key => ({
      name: key,
      value: defectMap[key]
    }));

    return {
      metrics: {
        totalWorkOrders,
        pendingWorkOrders,
        inProgressWorkOrders,
        completedWorkOrders,
        cancelledWorkOrders,
        totalPlannedQuantity,
        totalProducedQuantity,
        totalRejectedQuantity,
        totalRemainingQuantity,
        completionPercentage,
        overallRejectionRate
      },
      recentWorkOrders: workOrders.slice(0, 6),
      recentEntries,
      productionSummaryChart,
      defectSummaryChart
    };
  }
};
