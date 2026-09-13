import React from 'react';
import { 
  ClipboardList, 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  Hammer, 
  PieChart as PieChartIcon, 
  BarChart3, 
  ArrowRight,
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
  Legend,
  CartesianGrid
} from 'recharts';
import { DashboardMetrics, WorkOrder, ProductionEntry } from '../../types';
import { Badge } from '../common/Badge';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  recentWorkOrders: WorkOrder[];
  recentEntries: ProductionEntry[];
  productionSummaryChart: { name: string; planned: number; produced: number; remaining: number }[];
  defectSummaryChart: { name: string; value: number }[];
  onSelectTab: (tab: any) => void;
  onOpenCreateWorkOrder: () => void;
  onOpenWorkOrderDetail: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const DEFECT_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#8B5CF6', '#3B82F6', '#64748B'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  recentWorkOrders,
  recentEntries,
  productionSummaryChart,
  defectSummaryChart,
  onSelectTab,
  onOpenCreateWorkOrder,
  onOpenWorkOrderDetail,
  onRefresh,
  refreshing
}) => {
  const { role } = useAuth();
  const isDatabaseEmpty = metrics.totalWorkOrders === 0;

  // Clean Light Industrial Tooltip without heavy shadows
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-2xl font-mono text-xs text-slate-800">
          <div className="font-medium text-blue-600 mb-1.5 border-b border-slate-100 pb-1 font-display">{label}</div>
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-slate-500 flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                {item.name}:
              </span>
              <span className="font-medium font-mono text-slate-900 tabular-nums">{item.value.toLocaleString()} units</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 w-full font-sans">
      
      {/* Top Welcome & Refresh Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight flex items-center gap-2.5 font-display">
            <span>Plant Telemetry Dashboard</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-normal font-sans">
            Real-time shop-floor operational status, throughput actuals, and scrap containment
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-[30px] border border-slate-200 transition-colors disabled:opacity-60 cursor-pointer font-sans"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Polling...' : 'Live Refresh'}</span>
          </button>

          {(role === 'Supervisor' || role === 'Admin') && (
            <button
              onClick={onOpenCreateWorkOrder}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[30px] transition-all cursor-pointer font-sans"
            >
              <span>+ New Work Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty Database State Notice */}
      {isDatabaseEmpty ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-medium text-slate-900 font-display">No work orders available. Create your first work order.</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-sans font-normal">
            Your Supabase PostgreSQL database is connected and verified. Start production by scheduling your first order.
          </p>
          {(role === 'Supervisor' || role === 'Admin') && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={onOpenCreateWorkOrder}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[30px] transition-colors font-sans cursor-pointer"
              >
                + Create First Work Order
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Work Orders Status KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            
            {/* Total Work Orders */}
            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-2xl transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 font-sans">Total Orders</span>
                <ClipboardList className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-medium font-mono text-slate-900 mt-2 tracking-tight tabular-nums">
                {metrics.totalWorkOrders}
              </div>
              <span className="text-[11px] text-slate-400 font-sans">Registered batches</span>
            </div>

            {/* Pending Orders */}
            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-2xl transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-700 font-sans">Pending</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-medium font-mono text-slate-900 mt-2 tracking-tight tabular-nums">
                {metrics.pendingWorkOrders}
              </div>
              <span className="text-[11px] text-slate-400 font-sans">Awaiting line setup</span>
            </div>

            {/* In Progress Orders */}
            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-blue-500 rounded-2xl transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-700 font-sans">In Progress</span>
                <PlayCircle className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
              <div className="text-2xl font-medium font-mono text-slate-900 mt-2 tracking-tight tabular-nums">
                {metrics.inProgressWorkOrders}
              </div>
              <span className="text-[11px] text-blue-600 font-sans">Active on stations</span>
            </div>

            {/* Completed Orders */}
            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-emerald-600 rounded-2xl transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700 font-sans">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-medium font-mono text-slate-900 mt-2 tracking-tight tabular-nums">
                {metrics.completedWorkOrders}
              </div>
              <span className="text-[11px] text-emerald-600 font-sans">Target fulfilled</span>
            </div>

            {/* Cancelled Orders */}
            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-rose-500 rounded-2xl transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-700 font-sans">Cancelled</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-medium font-mono text-slate-900 mt-2 tracking-tight tabular-nums">
                {metrics.cancelledWorkOrders}
              </div>
              <span className="text-[11px] text-slate-400 font-sans">Aborted jobs</span>
            </div>

          </div>

          {/* Quantity Target & Progress KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            {/* Planned Quantity */}
            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-slate-400 rounded-2xl">
              <span className="text-xs font-medium text-slate-500 font-sans">Planned Target</span>
              <div className="text-2xl font-medium font-mono text-slate-900 mt-2 tracking-tight tabular-nums">
                {metrics.totalPlannedQuantity.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 font-sans">Total production target</span>
            </div>

            {/* Produced Quantity */}
            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-2xl">
              <span className="text-xs font-medium text-emerald-700 font-sans">Produced Good OK</span>
              <div className="text-2xl font-medium font-mono text-emerald-600 mt-2 tracking-tight tabular-nums">
                {metrics.totalProducedQuantity.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-700/80 font-sans">Conforming parts</span>
            </div>

            {/* Combined Total Rejected with Floor vs QC Breakdown */}
            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-rose-500 rounded-2xl relative group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-700 font-sans">Total Rejected</span>
                <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[30px] border border-rose-200">All Scrap</span>
              </div>
              <div className="text-2xl font-medium font-mono text-rose-600 mt-2 tracking-tight tabular-nums">
                {metrics.totalRejectedQuantity.toLocaleString()}
              </div>
              
              {/* Visually Distinguishable Source Breakdown */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500" title="Scrap recorded during operator shifts">
                  Floor: <strong className="text-slate-800 font-medium tabular-nums">{metrics.totalFloorRejectedQuantity ?? 0}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500" title="Defects identified during quality inspections">
                  QC: <strong className="text-amber-700 font-medium tabular-nums">{metrics.totalQcRejectedQuantity ?? 0}</strong>
                </span>
              </div>
            </div>

            {/* Remaining Quantity */}
            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-amber-400 rounded-2xl">
              <span className="text-xs font-medium text-amber-700 font-sans">Remaining Balance</span>
              <div className="text-2xl font-medium font-mono text-amber-600 mt-2 tracking-tight tabular-nums">
                {metrics.totalRemainingQuantity.toLocaleString()}
              </div>
              <span className="text-[11px] text-amber-700/80 font-sans">Units yet to produce</span>
            </div>

            {/* Production Completion % */}
            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-blue-500 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-700 font-sans">Fulfillment %</span>
                <span className="text-[10px] text-slate-400 font-sans">Good Units Only</span>
              </div>
              <div className="text-2xl font-medium font-mono text-blue-600 mt-2 flex items-baseline gap-1 tracking-tight tabular-nums">
                <span>{metrics.completionPercentage}%</span>
              </div>
              {/* Modern progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${metrics.completionPercentage}%` }} 
                />
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Production vs Planned Chart */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-medium text-slate-800 font-display">
                    Production Output vs Planned (Top Orders)
                  </h3>
                </div>
                <span className="text-[11px] font-sans text-slate-400">Telemetry Actuals</span>
              </div>

              {productionSummaryChart.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-sans">
                  No order production data available to chart.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productionSummaryChart} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} fontFamily="monospace" />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} fontFamily="monospace" />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="produced" fill="#10B981" name="Produced Good OK" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="remaining" fill="#93C5FD" name="Remaining Target" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Rejection / Defect Breakdown Chart */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-medium text-slate-800 font-display">
                    Scrap Defect Breakdown (Quality Audits)
                  </h3>
                </div>
                <span className="text-[11px] font-sans text-slate-400">QC Defect Distribution</span>
              </div>

              {defectSummaryChart.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 font-sans">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mb-2" />
                  <span>Zero QA defect scrap logged. Excellent shop-floor conformance!</span>
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
                        {defectSummaryChart.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={DEFECT_COLORS[index % DEFECT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          borderColor: '#E2E8F0', 
                          borderRadius: '16px', 
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: '#1E293B',
                        }} 
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        formatter={(val) => <span className="text-xs font-sans text-slate-600 font-normal">{val}</span>} 
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
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-medium text-slate-900 font-display">Recent Work Orders</h3>
                  </div>
                  <button
                    onClick={() => onSelectTab('work-orders')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors font-sans cursor-pointer"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-sans font-medium text-[11px]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Order #</th>
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentWorkOrders.slice(0, 5).map((wo) => {
                        const progress = wo.planned_quantity > 0 
                          ? Math.min(100, Math.round((wo.produced_quantity / wo.planned_quantity) * 100))
                          : 0;

                        return (
                          <tr 
                            key={wo.id} 
                            onClick={() => onOpenWorkOrderDetail(wo.id)}
                            className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 font-mono font-medium text-slate-900">
                              {wo.work_order_number}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate font-sans">
                              {wo.product_name}
                            </td>
                            <td className="px-4 py-3">
                              <Badge status={wo.status} />
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600 tabular-nums">
                              {wo.produced_quantity} / {wo.planned_quantity} ({progress}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-slate-50/60 border-t border-slate-100 text-[11px] text-slate-400 text-center font-sans font-normal">
                Click any row to open the complete work order details drawer
              </div>
            </div>

            {/* Recent Production Entries Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hammer className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-medium text-slate-900 font-display">Recent Shift Output</h3>
                  </div>
                  <button
                    onClick={() => onSelectTab('production')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors font-sans cursor-pointer"
                  >
                    <span>View all logs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {recentEntries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-sans">
                    No production shift entries recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-sans font-medium text-[11px]">
                        <tr>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Work Order</th>
                          <th className="px-4 py-3 font-medium">Shift</th>
                          <th className="px-4 py-3 text-right font-medium">Produced</th>
                          <th className="px-4 py-3 text-right font-medium">Scrap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentEntries.slice(0, 5).map((entry) => (
                          <tr key={entry.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">
                              {entry.production_date}
                            </td>
                            <td className="px-4 py-3 font-mono font-medium text-blue-600">
                              {entry.work_order?.work_order_number || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-[11px] font-sans">
                              {entry.shift.split(' ')[0]} {entry.shift.split(' ')[1]}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600 tabular-nums">
                              +{entry.produced_quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-medium text-rose-600 tabular-nums">
                              +{entry.rejected_quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50/60 border-t border-slate-100 text-[11px] text-slate-400 text-center font-sans font-normal">
                Shift logs automatically synchronize parent order actuals in PostgreSQL
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
