import React, { useState } from 'react';
import { 
  Cpu, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MapPin, 
  Calendar, 
  Filter, 
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Machine, UserRole } from '../../types';
import { Badge } from '../common/Badge';

interface MachineListProps {
  machines: Machine[];
  currentRole: UserRole;
  onOpenCreateModal: () => void;
  onOpenEditModal: (m: Machine) => void;
  onDeleteMachine: (m: Machine) => void;
}

export const MachineList: React.FC<MachineListProps> = ({
  machines,
  currentRole,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteMachine
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const canManage = currentRole === 'Supervisor' || currentRole === 'Admin';

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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            Machine &amp; Equipment Registry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor asset operational status, bay locations, and preventive maintenance
          </p>
        </div>

        {canManage && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Machine</span>
          </button>
        )}
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Running / Active</span>
            <div className="text-xl font-extrabold font-mono text-emerald-400 mt-0.5">{runningCount}</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Idle / Ready</span>
            <div className="text-xl font-extrabold font-mono text-amber-400 mt-0.5">{idleCount}</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-amber-400" />
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">In Maintenance</span>
            <div className="text-xl font-extrabold font-mono text-purple-400 mt-0.5">{maintCount}</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-purple-400" />
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Offline</span>
            <div className="text-xl font-extrabold font-mono text-rose-400 mt-0.5">{offlineCount}</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-rose-400" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by machine code, name, bay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
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
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
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
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3 border border-sky-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No machines found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {machines.length === 0
              ? 'No factory machines registered yet. Click "Add Machine" to configure equipment.'
              : 'No equipment matches the search criteria.'}
          </p>
          {canManage && machines.length === 0 && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
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
              className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-xl transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="font-mono text-xs font-extrabold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {machine.machine_code}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5 group-hover:text-sky-300 transition-colors">
                      {machine.machine_name}
                    </h3>
                  </div>
                  <Badge status={machine.status} type="machine" />
                </div>

                <div className="space-y-2 text-xs text-slate-400 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="text-slate-200 font-medium">{machine.department}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-300 flex items-center gap-1 font-mono text-[11px]">
                      <MapPin className="w-3 h-3 text-sky-400" />
                      {machine.location || 'Not set'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Service:</span>
                    <span className="text-slate-300 flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {machine.last_maintenance_date || 'No record'}
                    </span>
                  </div>

                  {machine.remarks && (
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 mt-3 leading-snug">
                      {machine.remarks}
                    </div>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => onOpenEditModal(machine)}
                    className="p-1.5 text-xs text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                    title="Edit machine"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onDeleteMachine(machine)}
                    className="p-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
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
