import React, { useState, useEffect } from 'react';
import { 
  X, 
  ClipboardList, 
  Calendar, 
  Cpu, 
  User, 
  CheckCircle2, 
  AlertOctagon, 
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
    ? Math.min(100, Math.round(((wo.produced_quantity + wo.rejected_quantity) / wo.planned_quantity) * 100)) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">{wo?.work_order_number || 'Loading...'}</h3>
                {wo && <Badge status={wo.status} />}
                {wo && <Badge status={wo.priority} type="priority" />}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {wo?.product_name} <span className="font-mono text-slate-500">({wo?.product_code})</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadDetails}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800/80 transition-colors"
              title="Refresh details"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading && !data ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
            <span>Loading work order details...</span>
          </div>
        ) : wo ? (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* KPI Progress Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Planned Target</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{wo.planned_quantity}</div>
                <span className="text-[10px] text-slate-500">Total units</span>
              </div>
              
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Produced OK</span>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{wo.produced_quantity}</div>
                <span className="text-[10px] text-emerald-500/80">{Math.round((wo.produced_quantity / wo.planned_quantity) * 100)}% of target</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Defects / Rejected</span>
                <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">{wo.rejected_quantity}</div>
                <span className="text-[10px] text-rose-500/80">Scrap parts</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Remaining</span>
                <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">{remaining}</div>
                <span className="text-[10px] text-amber-500/80">Units pending</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                  Overall Production Progress
                </span>
                <span className="font-mono font-bold text-sky-400">{completionPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (wo.produced_quantity / wo.planned_quantity) * 100)}%` }} 
                  title={`Produced: ${wo.produced_quantity}`}
                />
                <div 
                  className="bg-rose-500 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (wo.rejected_quantity / wo.planned_quantity) * 100)}%` }} 
                  title={`Rejected: ${wo.rejected_quantity}`}
                />
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Produced: {wo.produced_quantity}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Rejected: {wo.rejected_quantity}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700" /> Remaining: {remaining}</span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  <span>Machine:</span>
                  <span className="text-white font-medium">
                    {wo.machine ? `${wo.machine.machine_code} - ${wo.machine.machine_name}` : 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>Operator:</span>
                  <span className="text-white font-medium">
                    {wo.operator?.full_name || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>Start Date:</span>
                  <span className="text-white font-mono">{wo.start_date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Due Date:</span>
                  <span className="text-white font-mono">{wo.due_date}</span>
                </div>
              </div>
            </div>

            {wo.remarks && (
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Remarks &amp; Instructions
                </span>
                <p className="text-slate-400 leading-relaxed">{wo.remarks}</p>
              </div>
            )}

            {/* Production History Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Production Entries ({entries.length})
                </h4>
                {wo.status !== 'Completed' && wo.status !== 'Cancelled' && onOpenAddProduction && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddProduction(wo);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Log Shift
                  </button>
                )}
              </div>

              {entries.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/60">
                  No production shift entries logged yet for this work order.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5 font-medium">Date</th>
                        <th className="p-2.5 font-medium">Shift</th>
                        <th className="p-2.5 font-medium">Operator</th>
                        <th className="p-2.5 font-medium text-right">Produced</th>
                        <th className="p-2.5 font-medium text-right">Rejected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-mono text-slate-300">{entry.production_date}</td>
                          <td className="p-2.5 text-slate-300">{entry.shift}</td>
                          <td className="p-2.5 text-slate-300">{entry.operator?.full_name || 'Floor Operator'}</td>
                          <td className="p-2.5 font-mono text-right text-emerald-400 font-semibold">+{entry.produced_quantity}</td>
                          <td className="p-2.5 font-mono text-right text-rose-400 font-semibold">+{entry.rejected_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quality Inspection History Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                Quality Inspections ({inspections.length})
              </h4>

              {inspections.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/60">
                  No QC inspections recorded for this work order yet.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5 font-medium">Date</th>
                        <th className="p-2.5 font-medium">Inspector</th>
                        <th className="p-2.5 font-medium text-right">Inspected</th>
                        <th className="p-2.5 font-medium text-right">Passed</th>
                        <th className="p-2.5 font-medium text-right">Defects</th>
                        <th className="p-2.5 font-medium">Defect Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {inspections.map((qc) => (
                        <tr key={qc.id} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-mono text-slate-300">{qc.inspection_date}</td>
                          <td className="p-2.5 text-slate-300">{qc.inspector?.full_name || 'QA Tech'}</td>
                          <td className="p-2.5 font-mono text-right text-slate-300">{qc.inspected_quantity}</td>
                          <td className="p-2.5 font-mono text-right text-emerald-400 font-semibold">{qc.passed_quantity}</td>
                          <td className="p-2.5 font-mono text-right text-rose-400 font-semibold">{qc.rejected_quantity}</td>
                          <td className="p-2.5 text-slate-400">{qc.defect_reason || '-'}</td>
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
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
