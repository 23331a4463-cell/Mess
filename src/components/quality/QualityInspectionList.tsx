import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Percent,
  Calendar,
  Layers
} from 'lucide-react';
import { QualityInspection, WorkOrder, UserRole } from '../../types';

interface QualityInspectionListProps {
  inspections: QualityInspection[];
  workOrders: WorkOrder[];
  currentRole: UserRole;
  onOpenCreateModal: () => void;
  onOpenEditModal: (qc: QualityInspection) => void;
  onDeleteInspection: (qc: QualityInspection) => void;
}

export const QualityInspectionList: React.FC<QualityInspectionListProps> = ({
  inspections,
  workOrders,
  currentRole,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteInspection
}) => {
  const [search, setSearch] = useState('');
  const [selectedWoId, setSelectedWoId] = useState('ALL');

  const canManageQc = currentRole === 'Quality Inspector' || currentRole === 'Supervisor' || currentRole === 'Admin';

  const totalInspected = inspections.reduce((s, i) => s + (i.inspected_quantity || 0), 0);
  const totalPassed = inspections.reduce((s, i) => s + (i.passed_quantity || 0), 0);
  const totalDefects = inspections.reduce((s, i) => s + (i.rejected_quantity || 0), 0);
  const acceptanceRate = totalInspected > 0 ? Math.round((totalPassed / totalInspected) * 1000) / 10 : 100;
  const defectRate = totalInspected > 0 ? Math.round((totalDefects / totalInspected) * 1000) / 10 : 0;

  const filteredInspections = inspections.filter((i) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      i.work_order?.work_order_number.toLowerCase().includes(q) ||
      i.work_order?.product_name.toLowerCase().includes(q) ||
      (i.defect_reason && i.defect_reason.toLowerCase().includes(q));

    const matchesWo = selectedWoId === 'ALL' || i.work_order_id === selectedWoId;
    return matchesSearch && matchesWo;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            Quality Assurance &amp; Defect Inspection
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quality control audits, acceptance tests, defect tracking, and scrap containment
          </p>
        </div>

        {canManageQc && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Quality Inspection</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-medium text-slate-400">Total Audited Units</span>
          <div className="text-xl font-extrabold font-mono text-white mt-1">{totalInspected}</div>
          <span className="text-[10px] text-slate-500">Across {inspections.length} inspection lots</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-medium text-slate-400">Total Passed OK</span>
          <div className="text-xl font-extrabold font-mono text-emerald-400 mt-1">{totalPassed}</div>
          <span className="text-[10px] text-emerald-500/80">Conforming products</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-medium text-slate-400">Total Scrap / Defects</span>
          <div className="text-xl font-extrabold font-mono text-rose-400 mt-1">{totalDefects}</div>
          <span className="text-[10px] text-rose-500/80">Non-conforming items</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-medium text-slate-400">Acceptance Rate</span>
          <div className="text-xl font-extrabold font-mono text-sky-400 mt-1">{acceptanceRate}%</div>
          <span className={`text-[10px] ${defectRate > 3 ? 'text-amber-400' : 'text-slate-500'}`}>
            Defect rate: {defectRate}%
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by WO#, product, defect reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedWoId}
            onChange={(e) => setSelectedWoId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="ALL">Filter by All Work Orders</option>
            {workOrders.map((w) => (
              <option key={w.id} value={w.id}>
                {w.work_order_number} - {w.product_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredInspections.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-3 border border-purple-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No quality inspections found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {inspections.length === 0
              ? 'No quality audits logged yet. Quality inspectors can record sample testing and defect analysis.'
              : 'No inspections match your search criteria.'}
          </p>
          {canManageQc && inspections.length === 0 && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
            >
              + Log First Quality Check
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Work Order</th>
                  <th className="px-4 py-3.5">Inspector</th>
                  <th className="px-4 py-3.5 text-right">Inspected</th>
                  <th className="px-4 py-3.5 text-right">Passed</th>
                  <th className="px-4 py-3.5 text-right">Rejected</th>
                  <th className="px-4 py-3.5">Defect Reason</th>
                  <th className="px-4 py-3.5">Remarks</th>
                  {canManageQc && <th className="px-4 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInspections.map((qc) => {
                  const itemDefectPct = qc.inspected_quantity > 0 
                    ? Math.round((qc.rejected_quantity / qc.inspected_quantity) * 100) 
                    : 0;

                  return (
                    <tr key={qc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-white">
                        {qc.inspection_date}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-sky-400">
                          {qc.work_order?.work_order_number || 'N/A'}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {qc.work_order?.product_name}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        {qc.inspector?.full_name || 'QA Tech'}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-white font-semibold">
                        {qc.inspected_quantity}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                        {qc.passed_quantity}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-400">
                        {qc.rejected_quantity > 0 ? (
                          <span>
                            {qc.rejected_quantity} <span className="text-[10px] text-rose-500 font-normal">({itemDefectPct}%)</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {qc.defect_reason ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {qc.defect_reason}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Pass (Zero Defects)</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate text-[11px]">
                        {qc.remarks || '-'}
                      </td>

                      {canManageQc && (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenEditModal(qc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              title="Edit inspection"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteInspection(qc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Delete inspection"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Showing {filteredInspections.length} QA inspection records</span>
            <span>Passed Qty automatically calculated as (Inspected - Rejected)</span>
          </div>
        </div>
      )}

    </div>
  );
};
