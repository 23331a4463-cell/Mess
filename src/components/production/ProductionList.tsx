import React, { useState } from 'react';
import { Hammer, Plus, Search, Trash2, Filter } from 'lucide-react';
import { ProductionEntry } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ProductionListProps {
  entries: ProductionEntry[];
  onOpenCreateModal: () => void;
  onDeleteEntry: (entry: ProductionEntry) => void;
}

export const ProductionList: React.FC<ProductionListProps> = ({
  entries,
  onOpenCreateModal,
  onDeleteEntry
}) => {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');

  const canLog = role === 'Operator' || role === 'Supervisor' || role === 'Admin';
  const canDelete = role === 'Supervisor' || role === 'Admin';

  const filteredEntries = entries.filter((e) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      e.work_order?.work_order_number.toLowerCase().includes(q) ||
      e.work_order?.product_name.toLowerCase().includes(q) ||
      e.machine?.machine_code.toLowerCase().includes(q);

    const matchesShift = shiftFilter === 'ALL' || e.shift === shiftFilter;
    return matchesSearch && matchesShift;
  });

  return (
    <div className="space-y-6 w-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <Hammer className="w-5 h-5 text-blue-600" />
            Production Entries &amp; Shift Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal font-sans">
            Log shop-floor output batches, shift production, and scrap units in real time
          </p>
        </div>

        {canLog && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[30px] transition-colors shrink-0 font-sans cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Production Entry</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by WO#, product, machine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Shifts</option>
            <option value="Shift A (Morning)">Shift A (Morning)</option>
            <option value="Shift B (Evening)">Shift B (Evening)</option>
            <option value="Shift C (Night)">Shift C (Night)</option>
          </select>
        </div>
      </div>

      {/* Entries Table */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <Hammer className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-900 font-display">No production logs found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-sans font-normal">
            {entries.length === 0
              ? 'No production has been recorded yet. Click "Record Production Entry" to log finished and scrap units.'
              : 'No entries match your search criteria.'}
          </p>
          {canLog && entries.length === 0 && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[30px] transition-colors font-sans cursor-pointer"
            >
              + Record First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-medium font-sans text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 font-medium">Date &amp; Shift</th>
                  <th className="px-4 py-3.5 font-medium">Work Order</th>
                  <th className="px-4 py-3.5 font-medium">Machine</th>
                  <th className="px-4 py-3.5 font-medium">Operator</th>
                  <th className="px-4 py-3.5 text-right font-medium">Produced Qty</th>
                  <th className="px-4 py-3.5 text-right font-medium">Rejected Qty</th>
                  <th className="px-4 py-3.5 font-medium">Remarks</th>
                  {canDelete && <th className="px-4 py-3.5 text-right font-medium">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-blue-50/40 transition-colors">
                    
                    {/* Date & Shift */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-medium text-slate-900 tabular-nums">{entry.production_date}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-sans font-normal">{entry.shift}</div>
                    </td>

                    {/* Work Order */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-medium text-blue-600">
                        {entry.work_order?.work_order_number || 'N/A'}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5 font-sans font-normal">
                        {entry.work_order?.product_name}
                      </div>
                    </td>

                    {/* Machine */}
                    <td className="px-4 py-3.5 text-slate-700">
                      {entry.machine ? (
                        <span className="font-mono bg-slate-50 px-2.5 py-0.5 rounded-[30px] border border-slate-200 text-slate-700 text-[11px]">
                          {entry.machine.machine_code}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-sans font-normal">Unassigned</span>
                      )}
                    </td>

                    {/* Operator */}
                    <td className="px-4 py-3.5 text-slate-700 font-sans">
                      {entry.operator?.full_name || 'Floor Operator'}
                    </td>

                    {/* Quantities */}
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-emerald-600 tabular-nums">
                      +{entry.produced_quantity}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-rose-600 tabular-nums">
                      +{entry.rejected_quantity}
                    </td>

                    {/* Remarks */}
                    <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate text-[11px] font-sans font-normal">
                      {entry.remarks || '-'}
                    </td>

                    {/* Delete */}
                    {canDelete && (
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onDeleteEntry(entry)}
                          className="p-1.5 rounded-[30px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete entry and recalculate work order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-sans">
            <span>Showing {filteredEntries.length} production shift records</span>
            <span>Work order totals automatically updated upon each entry</span>
          </div>
        </div>
      )}

    </div>
  );
};
