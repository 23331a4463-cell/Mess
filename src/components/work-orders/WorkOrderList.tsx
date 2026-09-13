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
  Cpu
} from 'lucide-react';
import { WorkOrder, Machine, Profile } from '../../types';
import { Badge } from '../common/Badge';
import { useAuth } from '../../contexts/AuthContext';

interface WorkOrderListProps {
  workOrders: WorkOrder[];
  machines: Machine[];
  profiles: Profile[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (wo: WorkOrder) => void;
  onOpenDetailModal: (woId: string) => void;
  onDeleteWorkOrder: (wo: WorkOrder) => void;
}

export const WorkOrderList: React.FC<WorkOrderListProps> = ({
  workOrders,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDetailModal,
  onDeleteWorkOrder
}) => {
  const { role } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'created_desc' | 'due_asc' | 'planned_desc'>('created_desc');

  const canManage = role === 'Supervisor' || role === 'Admin';

  const filteredOrders = useMemo(() => {
    return workOrders
      .filter((order) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
          order.work_order_number.toLowerCase().includes(q) ||
          order.product_name.toLowerCase().includes(q) ||
          order.product_code.toLowerCase().includes(q);

        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
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
    <div className="space-y-6 w-full font-sans">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Work Order Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal font-sans">
            Create, track, schedule, and execute production orders across shop-floor lines
          </p>
        </div>

        {canManage && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[30px] transition-colors shrink-0 font-sans cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Work Order</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by WO#, product, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
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
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
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
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
          >
            <option value="created_desc">Newest Created</option>
            <option value="due_asc">Closest Due Date</option>
            <option value="planned_desc">Highest Planned Qty</option>
          </select>
        </div>

      </div>

      {/* Work Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-900 font-display">No work orders found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-sans font-normal">
            {workOrders.length === 0 
              ? 'No work orders available. Create your first work order.'
              : 'No work orders match the current filter or search criteria.'}
          </p>
          {canManage && workOrders.length === 0 && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[30px] transition-colors font-sans cursor-pointer"
            >
              + Create First Work Order
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-medium font-sans text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 font-medium">Work Order / Product</th>
                  <th className="px-4 py-3.5 font-medium">Status</th>
                  <th className="px-4 py-3.5 font-medium">Priority</th>
                  <th className="px-4 py-3.5 font-medium">Machine</th>
                  <th className="px-4 py-3.5 text-right font-medium">Planned</th>
                  <th className="px-4 py-3.5 text-right font-medium">Produced</th>
                  <th className="px-4 py-3.5 text-right font-medium">Rejected</th>
                  <th className="px-4 py-3.5 text-right font-medium">Remaining</th>
                  <th className="px-4 py-3.5 font-medium">Progress</th>
                  <th className="px-4 py-3.5 font-medium">Due Date</th>
                  <th className="px-4 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((wo) => {
                  const remaining = Math.max(0, wo.planned_quantity - wo.produced_quantity - wo.rejected_quantity);
                  const progressPct = wo.planned_quantity > 0 
                    ? Math.min(100, Math.round(((wo.produced_quantity + wo.rejected_quantity) / wo.planned_quantity) * 100))
                    : 0;

                  return (
                    <tr key={wo.id} className="hover:bg-blue-50/40 transition-colors group">
                      
                      {/* Order & Product */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => onOpenDetailModal(wo.id)}
                          className="text-left group-hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <div className="font-mono font-medium text-slate-900 text-xs flex items-center gap-1.5">
                            {wo.work_order_number}
                          </div>
                          <div className="text-slate-600 text-[11px] font-normal mt-0.5 font-sans">
                            {wo.product_name} <span className="text-slate-400 font-mono">({wo.product_code})</span>
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
                      <td className="px-4 py-3.5 text-slate-700">
                        {wo.machine ? (
                          <div className="flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-mono">{wo.machine.machine_code}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-sans">Unassigned</span>
                        )}
                      </td>

                      {/* Quantities */}
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-900 tabular-nums">
                        {wo.planned_quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-emerald-600 tabular-nums">
                        {wo.produced_quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-rose-600 tabular-nums">
                        {wo.rejected_quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-amber-600 tabular-nums">
                        {remaining}
                      </td>

                      {/* Progress Bar */}
                      <td className="px-4 py-3.5 min-w-[100px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono tabular-nums">
                            <span>{progressPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
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
                      <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px] tabular-nums">
                        {wo.due_date}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenDetailModal(wo.id)}
                            className="p-1.5 rounded-[30px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View order details and logs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => onOpenEditModal(wo)}
                                className="p-1.5 rounded-[30px] text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Edit work order"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onDeleteWorkOrder(wo)}
                                className="p-1.5 rounded-[30px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-sans">
            <span>Showing {filteredOrders.length} of {workOrders.length} work orders</span>
            <span>All records linked in real-time to Supabase PostgreSQL</span>
          </div>
        </div>
      )}

    </div>
  );
};
