import React from 'react';
import { 
  ClipboardList, 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Hammer, 
  AlertOctagon, 
  PieChart as PieChartIcon, 
  BarChart3, 
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { DashboardMetrics, WorkOrder, ProductionEntry, UserRole } from '../../types';
import { Badge } from '../common/Badge';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  recentWorkOrders: WorkOrder[];
  recentEntries: ProductionEntry[];
  productionSummaryChart: { name: string; planned: number; produced: number; remaining: number }[];
  defectSummaryChart: { name: string; value: number }[];
  onSelectTab: (tab: any) => void;
  onOpenCreateWorkOrder: () => void;
  onOpenWorkOrderDetail: (id: string) => void;
  currentRole: UserRole;
  onRefresh: () => void;
  refreshing: boolean;
}

const DEFECT_COLORS = ['#f43f5e', '#fb923c', '#eab308', '#a855f7', '#38bdf8', '#94a3b8'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  recentWorkOrders,
  recentEntries,
  productionSummaryChart,
  defectSummaryChart,
  onSelectTab,
  onOpenCreateWorkOrder,
  onOpenWorkOrderDetail,
  currentRole,
  onRefresh,
  refreshing
}) => {
  const isDatabaseEmpty = metrics.totalWorkOrders === 0;

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Refresh Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Shop-Floor Real-Time Dashboard</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated factory metrics, WIP tracking, and defect intelligence directly from Supabase PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Live Refresh'}</span>
          </button>

          {(currentRole === 'Supervisor' || currentRole === 'Admin') && (
            <button
              onClick={onOpenCreateWorkOrder}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-colors"
            >
              <span>+ New Work Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty Database State Notice */}
      {isDatabaseEmpty ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">No work orders available. Create your first work order.</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Your Supabase database is connected and ready. Start the manufacturing process by scheduling your first production order.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={onOpenCreateWorkOrder}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-colors"
            >
              + Create First Work Order
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Work Orders Status KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            
            {/* Total Work Orders */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Orders</span>
                <ClipboardList className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-white mt-2">
                {metrics.totalWorkOrders}
              </div>
              <span className="text-[10px] text-slate-500">All registered jobs</span>
            </div>

            {/* Pending Orders */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">Pending</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-white mt-2">
                {metrics.pendingWorkOrders}
              </div>
              <span className="text-[10px] text-slate-500">Awaiting production</span>
            </div>

            {/* In Progress Orders */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-400">In Progress</span>
                <PlayCircle className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-white mt-2">
                {metrics.inProgressWorkOrders}
              </div>
              <span className="text-[10px] text-sky-400/80">Active on floor</span>
            </div>

            {/* Completed Orders */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-white mt-2">
                {metrics.completedWorkOrders}
              </div>
              <span className="text-[10px] text-emerald-400/80">Target met</span>
            </div>

            {/* Cancelled Orders */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400">Cancelled</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-white mt-2">
                {metrics.cancelledWorkOrders}
              </div>
              <span className="text-[10px] text-slate-500">Aborted</span>
            </div>

          </div>

          {/* Quantity Target & Progress KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Planned Quantity */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400">Total Planned</span>
              <div className="text-2xl font-extrabold font-mono text-white mt-2">
                {metrics.totalPlannedQuantity.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Aggregate target units</span>
            </div>

            {/* Produced Quantity */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-emerald-400">Total Produced OK</span>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-2">
                {metrics.totalProducedQuantity.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-500/80">Good finished parts</span>
            </div>

            {/* Rejected Quantity */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-rose-400">Total Rejected</span>
              <div className="text-2xl font-extrabold font-mono text-rose-400 mt-2">
                {metrics.totalRejectedQuantity.toLocaleString()}
              </div>
              <span className="text-[10px] text-rose-500/80">Shift scrap units</span>
            </div>

            {/* Remaining Quantity */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-amber-400">Remaining Target</span>
              <div className="text-2xl font-extrabold font-mono text-amber-400 mt-2">
                {metrics.totalRemainingQuantity.toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-500/80">Units balance to produce</span>
            </div>

            {/* Production Completion % */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-sky-400">Completion %</span>
              <div className="text-2xl font-extrabold font-mono text-sky-400 mt-2 flex items-baseline gap-1">
                <span>{metrics.completionPercentage}%</span>
              </div>
              {/* Mini progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                  style={{ width: `${metrics.completionPercentage}%` }} 
                />
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Production vs Planned Chart */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Production Output vs Planned (Top Orders)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">Live units</span>
              </div>

              {productionSummaryChart.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No order production data yet to graph.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productionSummaryChart} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          color: '#f8fafc' 
                        }} 
                      />
                      <Bar dataKey="produced" fill="#10b981" name="Produced OK" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="remaining" fill="#38bdf8" name="Remaining Planned" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Rejection / Defect Breakdown Chart */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Defect Reason Distribution (Scrap Units)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">Quality audits</span>
              </div>

              {defectSummaryChart.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mb-2" />
                  <span>No defect scrap recorded yet. Excellent factory quality!</span>
                </div>
              ) : (
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={defectSummaryChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {defectSummaryChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DEFECT_COLORS[index % DEFECT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          color: '#f8fafc' 
                        }} 
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* Tables Row: Recent Work Orders & Recent Production Entries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Work Orders Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Work Orders</h3>
                  </div>
                  <button
                    onClick={() => onSelectTab('work-orders')}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">Order #</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {recentWorkOrders.slice(0, 5).map((wo) => {
                        const progress = wo.planned_quantity > 0 
                          ? Math.min(100, Math.round(((wo.produced_quantity + wo.rejected_quantity) / wo.planned_quantity) * 100))
                          : 0;

                        return (
                          <tr 
                            key={wo.id} 
                            onClick={() => onOpenWorkOrderDetail(wo.id)}
                            className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 font-mono font-bold text-white">
                              {wo.work_order_number}
                            </td>
                            <td className="px-4 py-3 text-slate-300 max-w-[140px] truncate">
                              {wo.product_name}
                            </td>
                            <td className="px-4 py-3">
                              <Badge status={wo.status} />
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                              {wo.produced_quantity} / {wo.planned_quantity} ({progress}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                Click any row to open the complete work order details
              </div>
            </div>

            {/* Recent Production Entries Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hammer className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Production Entries</h3>
                  </div>
                  <button
                    onClick={() => onSelectTab('production')}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                  >
                    <span>View all logs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {recentEntries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No production shift entries logged yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Work Order</th>
                          <th className="px-4 py-3">Shift</th>
                          <th className="px-4 py-3 text-right">Produced</th>
                          <th className="px-4 py-3 text-right">Rejected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {recentEntries.slice(0, 5).map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-300">
                              {entry.production_date}
                            </td>
                            <td className="px-4 py-3 font-mono font-medium text-sky-400">
                              {entry.work_order?.work_order_number || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-[11px]">
                              {entry.shift.split(' ')[0]} {entry.shift.split(' ')[1]}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                              +{entry.produced_quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-rose-400">
                              +{entry.rejected_quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-950/40 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                All production logs automatically increment work order actuals
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
