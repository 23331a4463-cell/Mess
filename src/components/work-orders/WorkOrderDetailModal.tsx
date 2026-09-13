import React, { useState, useEffect } from 'react';
import { 
  X, 
  ClipboardList, 
  Calendar, 
  Cpu, 
  User, 
  Clock, 
  FileText,
  Plus,
  BarChart3,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { WorkOrder, ProductionEntry, QualityInspection } from '../../types';
import { Badge } from '../common/Badge';
import { mesApi } from '../../services/mesApi';

interface WorkOrderDetailModalProps {
  workOrderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAddProduction?: (wo: WorkOrder) => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  workOrderId,
  isOpen,
  onClose,
  onOpenAddProduction
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    workOrder: WorkOrder;
    productionEntries: ProductionEntry[];
    inspections: QualityInspection[];
  } | null>(null);

  const loadDetails = async () => {
    if (!workOrderId) return;
    setLoading(true);
    try {
      const res = await mesApi.getWorkOrderById(workOrderId);
      setData(res);
    } catch (err) {
      console.error('Failed to load work order details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && workOrderId) {
      loadDetails();
    }
  }, [isOpen, workOrderId]);

  if (!isOpen || !workOrderId) return null;

  const wo = data?.workOrder;
  const entries = data?.productionEntries || [];
  const inspections = data?.inspections || [];

  const remaining = wo ? Math.max(0, wo.planned_quantity - wo.produced_quantity - wo.rejected_quantity) : 0;
  const completionPct = wo && wo.planned_quantity > 0 
    ? Math.min(100, Math.round((wo.produced_quantity / wo.planned_quantity) * 100)) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[30px] bg-blue-50 text-blue-600 border border-blue-100">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-slate-900 font-mono">{wo?.work_order_number || 'Loading...'}</h3>
                {wo && <Badge status={wo.status} />}
                {wo && <Badge status={wo.priority} type="priority" />}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-sans font-normal">
                {wo?.product_name} <span className="text-slate-400 font-mono">({wo?.product_code})</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadDetails}
              disabled={loading}
              className="p-2 rounded-[30px] text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Refresh details"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-[30px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading && !data ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3 font-sans">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading work order details...</span>
          </div>
        ) : wo ? (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* KPI Progress Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 font-sans">Planned Target</span>
                <div className="text-lg font-medium font-mono text-slate-900 mt-0.5 tabular-nums">{wo.planned_quantity}</div>
                <span className="text-[10px] text-slate-400 font-sans font-normal">Total units</span>
              </div>
              
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <span className="text-[11px] font-medium text-emerald-700 font-sans">Produced OK</span>
                <div className="text-lg font-medium font-mono text-emerald-600 mt-0.5 tabular-nums">{wo.produced_quantity}</div>
                <span className="text-[10px] text-emerald-700/80 font-sans font-normal">{Math.round((wo.produced_quantity / wo.planned_quantity) * 100)}% of target</span>
              </div>

              {/* Combined Total Rejected with Floor and QC Sub-Rows */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-rose-700 font-sans">Total Rejected</span>
                  <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[30px] border border-rose-200">Combined</span>
                </div>
                <div className="text-lg font-medium font-mono text-rose-600 mt-0.5 tabular-nums">{wo.rejected_quantity}</div>
                <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                  <span title="Floor shift scrap">Floor: <strong className="text-slate-700 font-medium tabular-nums">{wo.floor_rejected_quantity ?? 0}</strong></span>
                  <span>•</span>
                  <span title="Quality inspection defects">QC: <strong className="text-amber-700 font-medium tabular-nums">{wo.qc_rejected_quantity ?? 0}</strong></span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <span className="text-[11px] font-medium text-amber-700 font-sans">Remaining</span>
                <div className="text-lg font-medium font-mono text-amber-600 mt-0.5 tabular-nums">{remaining}</div>
                <span className="text-[10px] text-amber-700/80 font-sans font-normal">Units pending</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1.5 font-sans">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                  Target Fulfillment Progress
                </span>
                <span className="font-mono font-medium text-blue-600 tabular-nums">{completionPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (wo.produced_quantity / wo.planned_quantity) * 100)}%` }} 
                  title={`Produced Good: ${wo.produced_quantity}`}
                />
                <div 
                  className="bg-rose-500 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (wo.rejected_quantity / wo.planned_quantity) * 100)}%` }} 
                  title={`Rejected: ${wo.rejected_quantity}`}
                />
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Produced: {wo.produced_quantity}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Scrap: {wo.rejected_quantity}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> Remaining: {remaining}</span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>Machine:</span>
                  <span className="text-slate-800 font-medium font-sans">
                    {wo.machine ? `${wo.machine.machine_code} - ${wo.machine.machine_name}` : 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Operator:</span>
                  <span className="text-slate-800 font-medium font-sans">
                    {wo.operator?.full_name || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Start Date:</span>
                  <span className="text-slate-800 font-mono tabular-nums">{wo.start_date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Due Date:</span>
                  <span className="text-slate-800 font-mono tabular-nums">{wo.due_date}</span>
                </div>
              </div>
            </div>

            {wo.remarks && (
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1.5 mb-1 font-sans">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Remarks &amp; Instructions
                </span>
                <p className="text-slate-600 leading-relaxed font-sans font-normal">{wo.remarks}</p>
              </div>
            )}

            {/* Production History Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-slate-800 flex items-center gap-1.5 font-display">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Production Entries ({entries.length})
                </h4>
                {wo.status !== 'Completed' && wo.status !== 'Cancelled' && onOpenAddProduction && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddProduction(wo);
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-[30px] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Log Shift
                  </button>
                )}
              </div>

              {entries.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-200">
                  No production shift entries logged yet for this work order.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-sans">
                      <tr>
                        <th className="p-2.5 font-medium">Date</th>
                        <th className="p-2.5 font-medium">Shift</th>
                        <th className="p-2.5 font-medium">Operator</th>
                        <th className="p-2.5 font-medium text-right">Produced</th>
                        <th className="p-2.5 font-medium text-right">Rejected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-2.5 font-mono text-slate-600 tabular-nums">{entry.production_date}</td>
                          <td className="p-2.5 text-slate-700 font-sans">{entry.shift}</td>
                          <td className="p-2.5 text-slate-700 font-sans">{entry.operator?.full_name || 'Floor Operator'}</td>
                          <td className="p-2.5 font-mono text-right text-emerald-600 font-medium tabular-nums">+{entry.produced_quantity}</td>
                          <td className="p-2.5 font-mono text-right text-rose-600 font-medium tabular-nums">+{entry.rejected_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quality Inspection History Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-800 flex items-center gap-1.5 font-display">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Quality Inspections ({inspections.length})
              </h4>

              {inspections.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-200">
                  No QC inspections recorded for this work order yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-sans">
                      <tr>
                        <th className="p-2.5 font-medium">Date</th>
                        <th className="p-2.5 font-medium">Inspector</th>
                        <th className="p-2.5 font-medium text-right">Inspected</th>
                        <th className="p-2.5 font-medium text-right">Passed</th>
                        <th className="p-2.5 font-medium text-right">Defects</th>
                        <th className="p-2.5 font-medium">Defect Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspections.map((qc) => (
                        <tr key={qc.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-2.5 font-mono text-slate-600 tabular-nums">{qc.inspection_date}</td>
                          <td className="p-2.5 text-slate-700 font-sans">{qc.inspector?.full_name || 'QA Tech'}</td>
                          <td className="p-2.5 font-mono text-right text-slate-600 tabular-nums">{qc.inspected_quantity}</td>
                          <td className="p-2.5 font-mono text-right text-emerald-600 font-medium tabular-nums">{qc.passed_quantity}</td>
                          <td className="p-2.5 font-mono text-right text-rose-600 font-medium tabular-nums">{qc.rejected_quantity}</td>
                          <td className="p-2.5 text-slate-600 font-sans">{qc.defect_reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        ) : null}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-[30px] transition-colors border border-slate-200 cursor-pointer font-sans"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
