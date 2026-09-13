import React, { useState } from 'react';
import { Hammer, Plus, Search, Trash2, Calendar, Cpu, User, Filter } from 'lucide-react';
import { ProductionEntry, UserRole } from '../../types';

interface ProductionListProps {
  entries: ProductionEntry[];
  currentRole: UserRole;
  onOpenCreateModal: () => void;
  onDeleteEntry: (entry: ProductionEntry) => void;
}

export const ProductionList: React.FC<ProductionListProps> = ({
  entries,
  currentRole,
  onOpenCreateModal,
  onDeleteEntry
}) => {
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');

  const canLog = currentRole === 'Operator' || currentRole === 'Supervisor' || currentRole === 'Admin';
  const canDelete = currentRole === 'Supervisor' || currentRole === 'Admin';

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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Hammer className="w-5 h-5 text-sky-400" />
            Production Entries &amp; Shift Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log shop-floor output batches, shift production, and scrap units in real time
          </p>
        </div>

        {canLog && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record Production Entry</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by WO#, product, machine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
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
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3 border border-sky-500/20">
            <Hammer className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No production logs found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {entries.length === 0
              ? 'No production has been recorded yet. Click "Record Production Entry" to log finished and scrap units.'
              : 'No entries match your search criteria.'}
          </p>
          {canLog && entries.length === 0 && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
            >
              + Record First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Date &amp; Shift</th>
                  <th className="px-4 py-3.5">Work Order</th>
                  <th className="px-4 py-3.5">Machine</th>
                  <th className="px-4 py-3.5">Operator</th>
                  <th className="px-4 py-3.5 text-right">Produced Qty</th>
                  <th className="px-4 py-3.5 text-right">Rejected Qty</th>
                  <th className="px-4 py-3.5">Remarks</th>
                  {canDelete && <th className="px-4 py-3.5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Date & Shift */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-medium text-white">{entry.production_date}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{entry.shift}</div>
                    </td>

                    {/* Work Order */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-sky-400">
                        {entry.work_order?.work_order_number || 'N/A'}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {entry.work_order?.product_name}
                      </div>
                    </td>

                    {/* Machine */}
                    <td className="px-4 py-3.5 text-slate-300">
                      {entry.machine ? (
                        <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          {entry.machine.machine_code}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Operator */}
                    <td className="px-4 py-3.5 text-slate-300">
                      {entry.operator?.full_name || 'Floor Operator'}
                    </td>

                    {/* Quantities */}
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                      +{entry.produced_quantity}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-400">
                      +{entry.rejected_quantity}
                    </td>

                    {/* Remarks */}
                    <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate text-[11px]">
                      {entry.remarks || '-'}
                    </td>

                    {/* Delete */}
                    {canDelete && (
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onDeleteEntry(entry)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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

          <div className="px-4 py-3 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Showing {filteredEntries.length} production shift records</span>
            <span>Work order totals automatically updated upon each entry</span>
          </div>
        </div>
      )}

    </div>
  );
};
