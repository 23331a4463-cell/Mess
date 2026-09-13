import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  Cpu, 
  Calendar,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, Machine, Profile, UserRole } from '../../types';
import { Badge } from '../common/Badge';

interface WorkOrderListProps {
  workOrders: WorkOrder[];
  machines: Machine[];
  profiles: Profile[];
  currentRole: UserRole;
  onOpenCreateModal: () => void;
  onOpenEditModal: (wo: WorkOrder) => void;
  onOpenDetailModal: (woId: string) => void;
  onDeleteWorkOrder: (wo: WorkOrder) => void;
}

export const WorkOrderList: React.FC<WorkOrderListProps> = ({
  workOrders,
  machines,
  profiles,
  currentRole,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDetailModal,
  onDeleteWorkOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'created_desc' | 'due_asc' | 'planned_desc'>('created_desc');

  const canManage = currentRole === 'Supervisor' || currentRole === 'Admin';

  const filteredOrders = useMemo(() => {
    return workOrders
      .filter((order) => {
        // Search
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
          order.work_order_number.toLowerCase().includes(q) ||
          order.product_name.toLowerCase().includes(q) ||
          order.product_code.toLowerCase().includes(q);

        // Status
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

        // Priority
        const matchesPriority = priorityFilter === 'ALL' || order.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'created_desc') {
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        }
        if (sortBy === 'due_asc') {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (sortBy === 'planned_desc') {
          return b.planned_quantity - a.planned_quantity;
        }
        return 0;
      });
  }, [workOrders, searchQuery, statusFilter, priorityFilter, sortBy]);

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-400" />
            Work Order Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, track, schedule, and execute production orders across shop-floor lines
          </p>
        </div>

        {canManage && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Work Order</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by WO#, product, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
            <option value="Urgent">Urgent Priority</option>
          </select>
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="created_desc">Newest Created</option>
            <option value="due_asc">Closest Due Date</option>
            <option value="planned_desc">Highest Planned Qty</option>
          </select>
        </div>

      </div>

      {/* Work Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3 border border-sky-500/20">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No work orders found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {workOrders.length === 0 
              ? 'No work orders available. Create your first work order.'
              : 'No work orders match the current filter or search criteria.'}
          </p>
          {canManage && workOrders.length === 0 && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
            >
              + Create First Work Order
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Work Order / Product</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Machine</th>
                  <th className="px-4 py-3.5 text-right">Planned</th>
                  <th className="px-4 py-3.5 text-right">Produced</th>
                  <th className="px-4 py-3.5 text-right">Rejected</th>
                  <th className="px-4 py-3.5 text-right">Remaining</th>
                  <th className="px-4 py-3.5">Progress</th>
                  <th className="px-4 py-3.5">Due Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((wo) => {
                  const remaining = Math.max(0, wo.planned_quantity - wo.produced_quantity - wo.rejected_quantity);
                  const progressPct = wo.planned_quantity > 0 
                    ? Math.min(100, Math.round(((wo.produced_quantity + wo.rejected_quantity) / wo.planned_quantity) * 100))
                    : 0;

                  return (
                    <tr key={wo.id} className="hover:bg-slate-800/40 transition-colors group">
                      
                      {/* Order & Product */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => onOpenDetailModal(wo.id)}
                          className="text-left group-hover:text-sky-400 transition-colors"
                        >
                          <div className="font-mono font-bold text-white text-xs flex items-center gap-1.5">
                            {wo.work_order_number}
                          </div>
                          <div className="text-slate-400 text-[11px] font-medium mt-0.5">
                            {wo.product_name} <span className="text-slate-500 font-mono">({wo.product_code})</span>
                          </div>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge status={wo.status} />
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5">
                        <Badge status={wo.priority} type="priority" />
                      </td>

                      {/* Machine */}
                      <td className="px-4 py-3.5 text-slate-300">
                        {wo.machine ? (
                          <div className="flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="font-mono">{wo.machine.machine_code}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Quantities */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-white">
                        {wo.planned_quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-400">
                        {wo.produced_quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-rose-400">
                        {wo.rejected_quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-amber-400">
                        {remaining}
                      </td>

                      {/* Progress Bar */}
                      <td className="px-4 py-3.5 min-w-[100px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>{progressPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className="bg-emerald-500"
                              style={{ width: `${Math.min(100, (wo.produced_quantity / wo.planned_quantity) * 100)}%` }}
                            />
                            <div
                              className="bg-rose-500"
                              style={{ width: `${Math.min(100, (wo.rejected_quantity / wo.planned_quantity) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                        {wo.due_date}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenDetailModal(wo.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                            title="View order details and logs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => onOpenEditModal(wo)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                title="Edit work order"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onDeleteWorkOrder(wo)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                title="Delete work order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Showing {filteredOrders.length} of {workOrders.length} work orders</span>
            <span>All records linked in real-time to Supabase PostgreSQL</span>
          </div>
        </div>
      )}

    </div>
  );
};
