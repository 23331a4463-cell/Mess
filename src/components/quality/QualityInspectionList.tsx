import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Filter
} from 'lucide-react';
import { QualityInspection, WorkOrder } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface QualityInspectionListProps {
  inspections: QualityInspection[];
  workOrders: WorkOrder[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (qc: QualityInspection) => void;
  onDeleteInspection: (qc: QualityInspection) => void;
}

export const QualityInspectionList: React.FC<QualityInspectionListProps> = ({
  inspections,
  workOrders,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteInspection
}) => {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedWoId, setSelectedWoId] = useState('ALL');

  const canManageQc = role === 'Quality Inspector' || role === 'Supervisor' || role === 'Admin';

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
    <div className="space-y-6 w-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Quality Assurance &amp; Defect Inspection
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal font-sans">
            Quality control audits, acceptance tests, defect tracking, and scrap containment
          </p>
        </div>

        {canManageQc && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-[30px] transition-colors shrink-0 font-sans cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Quality Inspection</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-purple-500 rounded-2xl">
          <span className="text-xs font-medium text-slate-500 font-sans">Total Audited Units</span>
          <div className="text-2xl font-medium font-mono text-slate-900 mt-1 tabular-nums">{totalInspected}</div>
          <span className="text-[11px] text-slate-400 font-sans">Across {inspections.length} inspection lots</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-emerald-600 rounded-2xl">
          <span className="text-xs font-medium text-emerald-700 font-sans">Total Passed OK</span>
          <div className="text-2xl font-medium font-mono text-emerald-600 mt-1 tabular-nums">{totalPassed}</div>
          <span className="text-[11px] text-emerald-700/80 font-sans">Conforming products</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-rose-500 rounded-2xl">
          <span className="text-xs font-medium text-rose-700 font-sans">Total Scrap / Defects</span>
          <div className="text-2xl font-medium font-mono text-rose-600 mt-1 tabular-nums">{totalDefects}</div>
          <span className="text-[11px] text-rose-700/80 font-sans">Non-conforming items</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-blue-500 rounded-2xl">
          <span className="text-xs font-medium text-blue-700 font-sans">Acceptance Rate</span>
          <div className="text-2xl font-medium font-mono text-blue-600 mt-1 tabular-nums">{acceptanceRate}%</div>
          <span className={`text-[11px] font-sans ${defectRate > 3 ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>
            Defect rate: {defectRate}%
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by WO#, product, defect reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedWoId}
            onChange={(e) => setSelectedWoId(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors cursor-pointer"
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
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3 border border-purple-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-900 font-display">No quality inspections found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-sans font-normal">
            {inspections.length === 0
              ? 'No quality audits logged yet. Quality inspectors can record sample testing and defect analysis.'
              : 'No inspections match your search criteria.'}
          </p>
          {canManageQc && inspections.length === 0 && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-[30px] transition-colors font-sans cursor-pointer"
            >
              + Log First Quality Check
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-medium font-sans text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 font-medium">Date</th>
                  <th className="px-4 py-3.5 font-medium">Work Order</th>
                  <th className="px-4 py-3.5 font-medium">Inspector</th>
                  <th className="px-4 py-3.5 text-right font-medium">Inspected</th>
                  <th className="px-4 py-3.5 text-right font-medium">Passed</th>
                  <th className="px-4 py-3.5 text-right font-medium">Rejected</th>
                  <th className="px-4 py-3.5 font-medium">Defect Reason</th>
                  <th className="px-4 py-3.5 font-medium">Remarks</th>
                  {canManageQc && <th className="px-4 py-3.5 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInspections.map((qc) => {
                  const itemDefectPct = qc.inspected_quantity > 0 
                    ? Math.round((qc.rejected_quantity / qc.inspected_quantity) * 100) 
                    : 0;

                  return (
                    <tr key={qc.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-700 tabular-nums">
                        {qc.inspection_date}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono font-medium text-blue-600">
                          {qc.work_order?.work_order_number || 'N/A'}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5 font-sans font-normal">
                          {qc.work_order?.product_name}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 font-sans">
                        {qc.inspector?.full_name || 'QA Tech'}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-slate-900 font-medium tabular-nums">
                        {qc.inspected_quantity}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-medium text-emerald-600 tabular-nums">
                        {qc.passed_quantity}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-medium text-rose-600 tabular-nums">
                        {qc.rejected_quantity > 0 ? (
                          <span>
                            {qc.rejected_quantity} <span className="text-[10px] text-rose-500 font-normal">({itemDefectPct}%)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {qc.defect_reason ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[30px] text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            {qc.defect_reason}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-sans font-normal">Pass (Zero Defects)</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate text-[11px] font-sans font-normal">
                        {qc.remarks || '-'}
                      </td>

                      {canManageQc && (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenEditModal(qc)}
                              className="p-1.5 rounded-[30px] text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Edit inspection"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteInspection(qc)}
                              className="p-1.5 rounded-[30px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-sans">
            <span>Showing {filteredInspections.length} QA inspection records</span>
            <span>Passed Qty automatically calculated as (Inspected - Rejected)</span>
          </div>
        </div>
      )}

    </div>
  );
};
