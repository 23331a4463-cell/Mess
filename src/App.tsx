import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { WorkOrderList } from './components/work-orders/WorkOrderList';
import { WorkOrderModal } from './components/work-orders/WorkOrderModal';
import { WorkOrderDetailModal } from './components/work-orders/WorkOrderDetailModal';
import { ProductionList } from './components/production/ProductionList';
import { ProductionEntryModal } from './components/production/ProductionEntryModal';
import { QualityInspectionList } from './components/quality/QualityInspectionList';
import { QualityInspectionModal } from './components/quality/QualityInspectionModal';
import { MachineList } from './components/machines/MachineList';
import { MachineModal } from './components/machines/MachineModal';
import { SettingsView } from './components/settings/SettingsView';
import { ConnectionModal } from './components/common/ConnectionModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { ConfirmModal } from './components/common/ConfirmModal';

import { 
  WorkOrder, 
  Machine, 
  Profile, 
  ProductionEntry, 
  QualityInspection, 
  DashboardMetrics, 
  UserRole 
} from './types';
import { mesApi } from './services/mesApi';
import { isSupabaseConfigured, checkSupabaseConnection } from './lib/supabase';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('Supervisor');

  // Supabase Data State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
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
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([]);
  const [recentEntries, setRecentEntries] = useState<ProductionEntry[]>([]);
  const [productionChart, setProductionChart] = useState<any[]>([]);
  const [defectChart, setDefectChart] = useState<any[]>([]);

  // Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modals
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [detailWorkOrderId, setDetailWorkOrderId] = useState<string | null>(null);
  
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [preselectedProductionOrder, setPreselectedProductionOrder] = useState<WorkOrder | null>(null);

  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<QualityInspection | null>(null);

  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    danger: true,
    onConfirm: () => {}
  });

  // Load All Live Data from Supabase
  const loadData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setRefreshing(true);
    try {
      const [woList, mList, pList, peList, qiList, dashRes] = await Promise.all([
        mesApi.getWorkOrders(),
        mesApi.getMachines(),
        mesApi.getProfiles(),
        mesApi.getProductionEntries(50),
        mesApi.getQualityInspections(50),
        mesApi.getDashboardMetrics()
      ]);

      setWorkOrders(woList);
      setMachines(mList);
      setProfiles(pList);
      setProductionEntries(peList);
      setInspections(qiList);

      setDashboardMetrics(dashRes.metrics);
      setRecentWorkOrders(dashRes.recentWorkOrders);
      setRecentEntries(dashRes.recentEntries);
      setProductionChart(dashRes.productionSummaryChart);
      setDefectChart(dashRes.defectSummaryChart);
    } catch (err: any) {
      console.error('Error fetching Supabase MES records:', err);
      // If error is table missing, open connection modal
      if (err?.message?.includes('relation') || err?.message?.includes('does not exist')) {
        addToast('warning', 'Database Schema Notice', 'PostgreSQL tables not found. Please run the SQL schema.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-check connection on start
    checkSupabaseConnection().then(status => {
      if (!status.connected || !status.tablesFound) {
        // Open connection modal if not configured
        setIsConnectionModalOpen(true);
      }
    });
  }, [loadData]);

  // Handlers for Work Orders
  const handleDeleteWorkOrder = (wo: WorkOrder) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Work Order ${wo.work_order_number}?`,
      message: `Are you sure you want to delete ${wo.work_order_number} (${wo.product_name})? This will permanently delete the order and associated production logs.`,
      danger: true,
      onConfirm: async () => {
        try {
          await mesApi.deleteWorkOrder(wo.id);
          addToast('success', 'Work Order Deleted', `Order ${wo.work_order_number} has been removed.`);
          loadData();
        } catch (err: any) {
          addToast('error', 'Delete Failed', err.message);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Handlers for Production Entries
  const handleDeleteProductionEntry = (entry: ProductionEntry) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Production Entry?',
      message: `Delete shift entry of +${entry.produced_quantity} units? Work order totals will be automatically recalculated.`,
      danger: true,
      onConfirm: async () => {
        try {
          await mesApi.deleteProductionEntry(entry.id, entry.work_order_id);
          addToast('success', 'Entry Deleted', 'Shift log removed and work order synchronized.');
          loadData();
        } catch (err: any) {
          addToast('error', 'Delete Failed', err.message);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Handlers for Quality Inspections
  const handleDeleteInspection = (qc: QualityInspection) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Quality Inspection Record?',
      message: `Delete inspection audit of ${qc.inspected_quantity} units? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        try {
          await mesApi.deleteQualityInspection(qc.id);
          addToast('success', 'Inspection Deleted', 'Quality audit record removed.');
          loadData();
        } catch (err: any) {
          addToast('error', 'Delete Failed', err.message);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Handlers for Machines
  const handleDeleteMachine = (m: Machine) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Machine ${m.machine_code}?`,
      message: `Are you sure you want to remove ${m.machine_code} (${m.machine_name}) from the factory registry?`,
      danger: true,
      onConfirm: async () => {
        try {
          await mesApi.deleteMachine(m.id);
          addToast('success', 'Machine Deleted', `Machine ${m.machine_code} has been removed.`);
          loadData();
        } catch (err: any) {
          addToast('error', 'Deletion Blocked', err.message);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const runningMachines = machines.filter(m => m.status === 'Running').length;
  const inProgressOrders = workOrders.filter(w => w.status === 'In Progress').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        onOpenNewWorkOrder={() => {
          setEditingWorkOrder(null);
          setIsWorkOrderModalOpen(true);
        }}
        onOpenNewProduction={() => {
          setPreselectedProductionOrder(null);
          setIsProductionModalOpen(true);
        }}
      />

      {/* Main Body */}
      <div className="flex-1 flex">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentRole={currentRole}
          counts={{
            workOrders: workOrders.length,
            runningMachines,
            inProgressOrders
          }}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
              <span className="text-sm font-semibold">Connecting to Supabase PostgreSQL...</span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  metrics={dashboardMetrics}
                  recentWorkOrders={recentWorkOrders}
                  recentEntries={recentEntries}
                  productionSummaryChart={productionChart}
                  defectSummaryChart={defectChart}
                  onSelectTab={setActiveTab}
                  onOpenCreateWorkOrder={() => {
                    setEditingWorkOrder(null);
                    setIsWorkOrderModalOpen(true);
                  }}
                  onOpenWorkOrderDetail={(woId) => setDetailWorkOrderId(woId)}
                  currentRole={currentRole}
                  onRefresh={() => loadData(true)}
                  refreshing={refreshing}
                />
              )}

              {activeTab === 'work-orders' && (
                <WorkOrderList
                  workOrders={workOrders}
                  machines={machines}
                  profiles={profiles}
                  currentRole={currentRole}
                  onOpenCreateModal={() => {
                    setEditingWorkOrder(null);
                    setIsWorkOrderModalOpen(true);
                  }}
                  onOpenEditModal={(wo) => {
                    setEditingWorkOrder(wo);
                    setIsWorkOrderModalOpen(true);
                  }}
                  onOpenDetailModal={(woId) => setDetailWorkOrderId(woId)}
                  onDeleteWorkOrder={handleDeleteWorkOrder}
                />
              )}

              {activeTab === 'production' && (
                <ProductionList
                  entries={productionEntries}
                  currentRole={currentRole}
                  onOpenCreateModal={() => {
                    setPreselectedProductionOrder(null);
                    setIsProductionModalOpen(true);
                  }}
                  onDeleteEntry={handleDeleteProductionEntry}
                />
              )}

              {activeTab === 'quality' && (
                <QualityInspectionList
                  inspections={inspections}
                  workOrders={workOrders}
                  currentRole={currentRole}
                  onOpenCreateModal={() => {
                    setEditingInspection(null);
                    setIsQualityModalOpen(true);
                  }}
                  onOpenEditModal={(qc) => {
                    setEditingInspection(qc);
                    setIsQualityModalOpen(true);
                  }}
                  onDeleteInspection={handleDeleteInspection}
                />
              )}

              {activeTab === 'machines' && (
                <MachineList
                  machines={machines}
                  currentRole={currentRole}
                  onOpenCreateModal={() => {
                    setEditingMachine(null);
                    setIsMachineModalOpen(true);
                  }}
                  onOpenEditModal={(m) => {
                    setEditingMachine(m);
                    setIsMachineModalOpen(true);
                  }}
                  onDeleteMachine={handleDeleteMachine}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
                  currentRole={currentRole}
                  onRoleChange={setCurrentRole}
                />
              )}
            </>
          )}
        </main>

      </div>

      {/* Global Modals */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onConnectionChange={() => loadData(true)}
      />

      <WorkOrderModal
        isOpen={isWorkOrderModalOpen}
        onClose={() => setIsWorkOrderModalOpen(false)}
        onSuccess={(wo) => {
          addToast('success', 'Work Order Saved', `Order ${wo.work_order_number} is ready.`);
          loadData();
        }}
        editOrder={editingWorkOrder}
        machines={machines}
        profiles={profiles}
      />

      <WorkOrderDetailModal
        isOpen={!!detailWorkOrderId}
        workOrderId={detailWorkOrderId}
        onClose={() => setDetailWorkOrderId(null)}
        onOpenAddProduction={(wo) => {
          setPreselectedProductionOrder(wo);
          setIsProductionModalOpen(true);
        }}
      />

      <ProductionEntryModal
        isOpen={isProductionModalOpen}
        onClose={() => setIsProductionModalOpen(false)}
        onSuccess={() => {
          addToast('success', 'Production Recorded', 'Work order actuals and remaining counts updated.');
          loadData();
        }}
        preselectedWorkOrder={preselectedProductionOrder}
        workOrders={workOrders}
        machines={machines}
        profiles={profiles}
      />

      <QualityInspectionModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        onSuccess={() => {
          addToast('success', 'Quality Inspection Logged', 'Inspection verified and defect ratios calculated.');
          loadData();
        }}
        editInspection={editingInspection}
        workOrders={workOrders}
        profiles={profiles}
      />

      <MachineModal
        isOpen={isMachineModalOpen}
        onClose={() => setIsMachineModalOpen(false)}
        onSuccess={(m) => {
          addToast('success', 'Machine Saved', `Machine ${m.machine_code} configured.`);
          loadData();
        }}
        editMachine={editingMachine}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        danger={confirmModal.danger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}
export default App;
