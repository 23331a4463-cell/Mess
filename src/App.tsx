import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginView } from './components/auth/LoginView';
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
import { ScheduleView } from './components/schedule/ScheduleView';
import { ConnectionModal } from './components/common/ConnectionModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { ConfirmModal } from './components/common/ConfirmModal';

import { 
  WorkOrder, 
  Machine, 
  Profile, 
  ProductionEntry, 
  QualityInspection, 
  DashboardMetrics 
} from './types';
import { mesApi } from './services/mesApi';
import { checkSupabaseConnection } from './lib/supabase';
import { RefreshCw } from 'lucide-react';

const MesAppContent: React.FC = () => {
  const { session, loading: authLoading } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

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
    overallRejectionRate: 0,
    totalFloorRejectedQuantity: 0,
    totalQcRejectedQuantity: 0
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
      if (err?.message?.includes('relation') || err?.message?.includes('does not exist')) {
        addToast('warning', 'Database Schema Notice', 'PostgreSQL tables not found. Please run the SQL schema.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      loadData();
      checkSupabaseConnection().then(status => {
        if (!status.connected || !status.tablesFound) {
          setIsConnectionModalOpen(true);
        }
      });
    }
  }, [session, loadData]);

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

  const handleRescheduleWorkOrder = async (woId: string, newStartDate: string, newDueDate: string) => {
    try {
      // Optimistically update local state
      setWorkOrders(prev => prev.map(w => w.id === woId ? { ...w, start_date: newStartDate, due_date: newDueDate } : w));
      
      await mesApi.updateWorkOrder(woId, {
        start_date: newStartDate,
        due_date: newDueDate
      });
      addToast('success', 'Work Order Rescheduled', `Updated timeline span to ${newStartDate} – ${newDueDate}`);
      loadData();
    } catch (err: any) {
      addToast('error', 'Rescheduling Failed', err.message || 'Unable to update work order schedule.');
      loadData(); // revert
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-slate-600">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Initializing Industrial MES Session...</span>
      </div>
    );
  }

  // Gated Login View
  if (!session) {
    return <LoginView />;
  }

  const runningMachines = machines.filter(m => m.status === 'Running').length;
  const inProgressOrders = workOrders.filter(w => w.status === 'In Progress').length;

  return (
    <div className="min-h-screen bg-white text-[#1E2939] flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
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
          counts={{
            workOrders: workOrders.length,
            runningMachines,
            inProgressOrders
          }}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-600">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Connecting to Supabase PostgreSQL...</span>
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
                  onRefresh={() => loadData(true)}
                  refreshing={refreshing}
                />
              )}

              {activeTab === 'work-orders' && (
                <WorkOrderList
                  workOrders={workOrders}
                  machines={machines}
                  profiles={profiles}
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

              {activeTab === 'schedule' && (
                <ScheduleView
                  workOrders={workOrders}
                  machines={machines}
                  onOpenDetailModal={(woId) => setDetailWorkOrderId(woId)}
                  onRescheduleWorkOrder={handleRescheduleWorkOrder}
                  onRefresh={() => loadData(true)}
                />
              )}

              {activeTab === 'production' && (
                <ProductionList
                  entries={productionEntries}
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
};

export function App() {
  return (
    <AuthProvider>
      <MesAppContent />
    </AuthProvider>
  );
}

export default App;
