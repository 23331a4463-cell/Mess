import React, { useState } from 'react';
import { 
  Cpu, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MapPin, 
  Calendar, 
  Filter
} from 'lucide-react';
import { Machine } from '../../types';
import { Badge } from '../common/Badge';
import { useAuth } from '../../contexts/AuthContext';

interface MachineListProps {
  machines: Machine[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (m: Machine) => void;
  onDeleteMachine: (m: Machine) => void;
}

export const MachineList: React.FC<MachineListProps> = ({
  machines,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteMachine
}) => {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const canManage = role === 'Supervisor' || role === 'Admin';

  const departments = Array.from(new Set(machines.map(m => m.department)));

  const filteredMachines = machines.filter((m) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      m.machine_code.toLowerCase().includes(q) ||
      m.machine_name.toLowerCase().includes(q) ||
      (m.location && m.location.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesDept = deptFilter === 'ALL' || m.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const runningCount = machines.filter(m => m.status === 'Running').length;
  const idleCount = machines.filter(m => m.status === 'Idle').length;
  const maintCount = machines.filter(m => m.status === 'Maintenance').length;
  const offlineCount = machines.filter(m => m.status === 'Offline').length;

  return (
    <div className="space-y-6 w-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <Cpu className="w-5 h-5 text-blue-600" />
            Machine &amp; Equipment Registry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal font-sans">
            Monitor asset operational status, bay locations, and preventive maintenance
          </p>
        </div>

        {canManage && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[30px] transition-colors shrink-0 font-sans cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Machine</span>
          </button>
        )}
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-emerald-600 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-emerald-700 font-sans">Running / Active</span>
            <div className="text-2xl font-medium font-mono text-emerald-600 mt-0.5 tabular-nums">{runningCount}</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
        </div>

        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-slate-400 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 font-sans">Idle / Ready</span>
            <div className="text-2xl font-medium font-mono text-slate-700 mt-0.5 tabular-nums">{idleCount}</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-slate-400" />
        </div>

        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-amber-700 font-sans">In Maintenance</span>
            <div className="text-2xl font-medium font-mono text-amber-600 mt-0.5 tabular-nums">{maintCount}</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-amber-500" />
        </div>

        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-rose-500 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-rose-700 font-sans">Offline</span>
            <div className="text-2xl font-medium font-mono text-rose-600 mt-0.5 tabular-nums">{offlineCount}</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-rose-500" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by machine code, name, bay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Running">Running</option>
            <option value="Idle">Idle</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Machine Cards */}
      {filteredMachines.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-900 font-display">No machines found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-sans font-normal">
            {machines.length === 0
              ? 'No factory machines registered yet. Click "Add Machine" to configure equipment.'
              : 'No equipment matches the search criteria.'}
          </p>
          {canManage && machines.length === 0 && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[30px] transition-colors font-sans cursor-pointer"
            >
              + Register First Machine
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMachines.map((machine) => (
            <div
              key={machine.id}
              className="p-5 bg-white border border-slate-200 rounded-2xl transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="font-mono text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-[30px] border border-blue-200">
                      {machine.machine_code}
                    </span>
                    <h3 className="text-sm font-medium text-slate-900 mt-1.5 group-hover:text-blue-600 transition-colors font-display">
                      {machine.machine_name}
                    </h3>
                  </div>
                  <Badge status={machine.status} type="machine" />
                </div>

                <div className="space-y-2 text-xs text-slate-600 mt-4 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="text-slate-800 font-medium">{machine.department}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-700 flex items-center gap-1 font-mono text-[11px]">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      {machine.location || 'Not set'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Last Service:</span>
                    <span className="text-slate-700 flex items-center gap-1 font-mono text-[11px] tabular-nums">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {machine.last_maintenance_date || 'No record'}
                    </span>
                  </div>

                  {machine.remarks && (
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 mt-3 leading-snug font-normal">
                      {machine.remarks}
                    </div>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onOpenEditModal(machine)}
                    className="p-1.5 text-xs text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-[30px] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Edit machine"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onDeleteMachine(machine)}
                    className="p-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[30px] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Delete machine"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
