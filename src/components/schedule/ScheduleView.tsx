import React, { useState, useMemo, useRef } from 'react';
import { 
  CalendarRange, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  XCircle, 
  Layers, 
  MoveHorizontal,
  Info,
  ExternalLink
} from 'lucide-react';
import { WorkOrder, Machine, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ScheduleViewProps {
  workOrders: WorkOrder[];
  machines: Machine[];
  onOpenDetailModal: (woId: string) => void;
  onRescheduleWorkOrder?: (woId: string, newStartDate: string, newDueDate: string) => Promise<void>;
  onRefresh?: () => void;
}

type ViewMode = 'week' | 'month';

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  workOrders,
  machines,
  onOpenDetailModal,
  onRescheduleWorkOrder
}) => {
  const { role } = useAuth();
  const canEdit = role === 'Admin' || role === 'Supervisor';

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [hoveredWoId, setHoveredWoId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Helper date string formatter (YYYY-MM-DD)
  const toDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = toDateStr(new Date());

  // Compute timeline dates based on viewMode & currentDate
  const timelineDates = useMemo(() => {
    const dates: { dateStr: string; date: Date; isToday: boolean; dayName: string; dayNum: number; monthName: string }[] = [];
    
    if (viewMode === 'week') {
      // Find Monday of current week
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      const monday = new Date(d.setDate(diff));

      for (let i = 0; i < 7; i++) {
        const itemDate = new Date(monday);
        itemDate.setDate(monday.getDate() + i);
        const dateStr = toDateStr(itemDate);
        dates.push({
          dateStr,
          date: itemDate,
          isToday: dateStr === todayStr,
          dayName: itemDate.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNum: itemDate.getDate(),
          monthName: itemDate.toLocaleDateString('en-US', { month: 'short' })
        });
      }
    } else {
      // Month view: full calendar month of currentDate
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const itemDate = new Date(year, month, dayNum);
        const dateStr = toDateStr(itemDate);
        dates.push({
          dateStr,
          date: itemDate,
          isToday: dateStr === todayStr,
          dayName: itemDate.toLocaleDateString('en-US', { weekday: 'narrow' }),
          dayNum,
          monthName: itemDate.toLocaleDateString('en-US', { month: 'short' })
        });
      }
    }

    return dates;
  }, [currentDate, viewMode, todayStr]);

  const startDateRange = timelineDates[0]?.dateStr || '';
  const endDateRange = timelineDates[timelineDates.length - 1]?.dateStr || '';

  // Navigate dates
  const handlePrev = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (viewMode === 'week') {
        next.setDate(next.getDate() - 7);
      } else {
        next.setMonth(next.getMonth() - 1);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (viewMode === 'week') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Check overlaps for each machine
  const machineOverlaps = useMemo(() => {
    const overlapsMap = new Map<string, { count: number; conflictingOrders: string[] }>();

    machines.forEach(m => {
      const assignedOrders = workOrders.filter(w => 
        w.machine_id === m.id && 
        w.status !== 'Cancelled' &&
        w.start_date <= endDateRange &&
        w.due_date >= startDateRange
      );

      let overlapCount = 0;
      const conflicting = new Set<string>();

      for (let i = 0; i < assignedOrders.length; i++) {
        for (let j = i + 1; j < assignedOrders.length; j++) {
          const a = assignedOrders[i];
          const b = assignedOrders[j];
          // Check date collision
          if (a.start_date <= b.due_date && b.start_date <= a.due_date) {
            overlapCount++;
            conflicting.add(a.work_order_number);
            conflicting.add(b.work_order_number);
          }
        }
      }

      if (overlapCount > 0) {
        overlapsMap.set(m.id, {
          count: overlapCount,
          conflictingOrders: Array.from(conflicting)
        });
      }
    });

    return overlapsMap;
  }, [machines, workOrders, startDateRange, endDateRange]);

  // Status visual styles
  const getStatusBadge = (status: WorkOrder['status']) => {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-amber-100/90 border-amber-300 text-amber-900',
          fill: 'bg-amber-300/40',
          dot: 'bg-amber-500'
        };
      case 'In Progress':
        return {
          bg: 'bg-sky-100/95 border-sky-300 text-sky-900',
          fill: 'bg-sky-400/35',
          dot: 'bg-sky-600'
        };
      case 'Completed':
        return {
          bg: 'bg-emerald-100/95 border-emerald-300 text-emerald-900',
          fill: 'bg-emerald-400/40',
          dot: 'bg-emerald-600'
        };
      case 'Cancelled':
      default:
        return {
          bg: 'bg-slate-100 border-slate-300 text-slate-700',
          fill: 'bg-slate-300/40',
          dot: 'bg-slate-400'
        };
    }
  };

  // Drag-to-reschedule state
  const [dragState, setDragState] = useState<{
    woId: string;
    mode: 'move' | 'resize-end' | 'resize-start';
    startX: number;
    initialStartDate: string;
    initialDueDate: string;
    currentStartDate: string;
    currentDueDate: string;
  } | null>(null);

  const handlePointerDown = (
    e: React.PointerEvent,
    wo: WorkOrder,
    mode: 'move' | 'resize-end' | 'resize-start'
  ) => {
    if (!canEdit) return;
    e.stopPropagation();
    e.preventDefault();

    setDragState({
      woId: wo.id,
      mode,
      startX: e.clientX,
      initialStartDate: wo.start_date,
      initialDueDate: wo.due_date,
      currentStartDate: wo.start_date,
      currentDueDate: wo.due_date
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || !timelineContainerRef.current) return;

    const totalDays = timelineDates.length;
    const containerWidth = timelineContainerRef.current.clientWidth;
    const dayWidth = containerWidth / totalDays;

    const deltaX = e.clientX - dragState.startX;
    const deltaDays = Math.round(deltaX / dayWidth);

    if (deltaDays === 0) return;

    const addDaysToStr = (baseStr: string, daysToAdd: number): string => {
      const d = new Date(baseStr + 'T00:00:00');
      d.setDate(d.getDate() + daysToAdd);
      return toDateStr(d);
    };

    if (dragState.mode === 'move') {
      const newStart = addDaysToStr(dragState.initialStartDate, deltaDays);
      const newDue = addDaysToStr(dragState.initialDueDate, deltaDays);
      setDragState(prev => prev ? { ...prev, currentStartDate: newStart, currentDueDate: newDue } : null);
    } else if (dragState.mode === 'resize-end') {
      const newDue = addDaysToStr(dragState.initialDueDate, deltaDays);
      if (newDue >= dragState.initialStartDate) {
        setDragState(prev => prev ? { ...prev, currentDueDate: newDue } : null);
      }
    } else if (dragState.mode === 'resize-start') {
      const newStart = addDaysToStr(dragState.initialStartDate, deltaDays);
      if (newStart <= dragState.initialDueDate) {
        setDragState(prev => prev ? { ...prev, currentStartDate: newStart } : null);
      }
    }
  };

  const handlePointerUp = async () => {
    if (!dragState) return;

    const { woId, initialStartDate, initialDueDate, currentStartDate, currentDueDate } = dragState;
    setDragState(null);

    // If dates changed, trigger reschedule
    if (
      (currentStartDate !== initialStartDate || currentDueDate !== initialDueDate) && 
      onRescheduleWorkOrder
    ) {
      setReschedulingId(woId);
      try {
        await onRescheduleWorkOrder(woId, currentStartDate, currentDueDate);
      } finally {
        setReschedulingId(null);
      }
    }
  };

  return (
    <div 
      className="w-full space-y-5 select-none font-sans"
      onPointerMove={dragState ? handlePointerMove : undefined}
      onPointerUp={dragState ? handlePointerUp : undefined}
    >
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-[#E8ECF3] rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
            <CalendarRange className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-[#1E2939] tracking-tight">Machine Scheduling &amp; Gantt Timeline</h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Visual dispatch matrix, workstation loading, and work order span management
            </p>
          </div>
        </div>

        {/* Controls: Prev/Next, Today, View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navigation */}
          <div className="flex items-center bg-white border border-[#E8ECF3] rounded-[30px] p-1">
            <button
              onClick={handlePrev}
              title="Previous period"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-[30px] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-[30px] transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              title="Next period"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-[30px] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Current Span Display */}
          <div className="px-3.5 py-1.5 bg-slate-50 border border-[#E8ECF3] rounded-[30px] text-xs font-medium text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>
              {timelineDates[0]?.monthName} {timelineDates[0]?.dayNum} &ndash; {timelineDates[timelineDates.length - 1]?.monthName} {timelineDates[timelineDates.length - 1]?.dayNum}, {currentDate.getFullYear()}
            </span>
          </div>

          {/* View Mode Toggle: Week vs Month */}
          <div className="flex items-center bg-slate-100 border border-[#E8ECF3] rounded-[30px] p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-medium rounded-[30px] transition-all cursor-pointer ${
                viewMode === 'week' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-medium rounded-[30px] transition-all cursor-pointer ${
                viewMode === 'month' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month View
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Guidance Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-white border border-[#E8ECF3] rounded-2xl text-xs">
        {/* Status color chips */}
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <span className="font-medium text-slate-700">Status Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            <span>In Progress (Progress Fill)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Overdue Alert</span>
          </div>
        </div>

        {/* User Interaction hint */}
        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          <Info className="w-3.5 h-3.5 text-sky-600" />
          <span>
            {canEdit 
              ? 'Drag bars horizontally to reschedule; drag right edge to adjust due date. Click for details.' 
              : 'Read-only Gantt matrix. Contact Supervisor or Admin to adjust machine schedules.'}
          </span>
        </div>
      </div>

      {/* Main Gantt Timeline Matrix */}
      <div className="bg-white border border-[#E8ECF3] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto relative">
          <div className="min-w-[950px]">
            
            {/* Header Row: Machine Label + Days of Period */}
            <div className="flex border-b border-[#E8ECF3] bg-[#F7F9FC]">
              {/* Sticky Machine column header */}
              <div className="w-72 shrink-0 p-3.5 border-r border-[#E8ECF3] font-medium text-xs text-slate-700 flex items-center justify-between bg-[#F7F9FC]">
                <span>Machine Workstation</span>
                <span className="text-[11px] text-slate-400 font-mono">{machines.length} Units</span>
              </div>

              {/* Day Headers */}
              <div className="flex-1 flex" ref={timelineContainerRef}>
                {timelineDates.map((d) => (
                  <div
                    key={d.dateStr}
                    className={`flex-1 p-2.5 text-center border-r border-[#E8ECF3] last:border-r-0 transition-colors ${
                      d.isToday ? 'bg-sky-50/70 border-b-2 border-b-sky-600' : ''
                    }`}
                  >
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      {d.dayName}
                    </div>
                    <div className={`text-xs font-medium mt-0.5 ${d.isToday ? 'text-sky-700 font-bold' : 'text-slate-800'}`}>
                      {d.dayNum}
                    </div>
                    {d.isToday && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-medium text-sky-700 bg-sky-100 rounded-[30px]">
                        Today
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Machine Rows */}
            <div className="divide-y divide-[#E8ECF3]">
              {machines.map((machine) => {
                const overlapInfo = machineOverlaps.get(machine.id);

                // Orders assigned to this machine that intersect with visible timeline range
                const assignedOrders = workOrders.filter(w => 
                  w.machine_id === machine.id &&
                  w.status !== 'Cancelled' &&
                  w.start_date <= endDateRange &&
                  w.due_date >= startDateRange
                );

                // Determine vertical stacking / lanes for overlapping orders
                // Assign each order a lane index so overlapping orders don't obscure each other
                const orderLanes = new Map<string, number>();
                assignedOrders.forEach(order => {
                  let lane = 0;
                  // check which lane is free
                  while (
                    assignedOrders.some(other => 
                      other.id !== order.id &&
                      orderLanes.has(other.id) &&
                      orderLanes.get(other.id) === lane &&
                      other.start_date <= order.due_date &&
                      order.start_date <= other.due_date
                    )
                  ) {
                    lane++;
                  }
                  orderLanes.set(order.id, lane);
                });

                const maxLane = assignedOrders.reduce((max, o) => Math.max(max, orderLanes.get(o.id) || 0), 0);
                // Dynamic row height based on lanes
                const rowHeightPx = Math.max(72, (maxLane + 1) * 36 + 28);

                return (
                  <div 
                    key={machine.id} 
                    className="flex hover:bg-slate-50/40 transition-colors"
                    style={{ minHeight: `${rowHeightPx}px` }}
                  >
                    {/* Machine Meta Column */}
                    <div className="w-72 shrink-0 p-3.5 border-r border-[#E8ECF3] flex flex-col justify-center bg-white">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-[30px] border border-sky-100">
                          {machine.machine_code}
                        </span>

                        {/* Overload Warning Badge */}
                        {overlapInfo && (
                          <span 
                            className="flex items-center gap-1 px-2 py-0.5 rounded-[30px] bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium"
                            title={`Conflict: ${overlapInfo.count} overlapping order(s): ${overlapInfo.conflictingOrders.join(', ')}`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Conflict ({overlapInfo.count})</span>
                          </span>
                        )}
                      </div>

                      <div className="font-medium text-xs text-[#1E2939] truncate mt-1">
                        {machine.machine_name}
                      </div>

                      <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center justify-between">
                        <span>{machine.department}</span>
                        <span className="capitalize text-[10px] text-slate-400">
                          {machine.status}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Grid Cell Container */}
                    <div className="flex-1 relative flex">
                      {/* Grid background column stripes */}
                      {timelineDates.map((d) => (
                        <div
                          key={d.dateStr}
                          className={`flex-1 border-r border-[#E8ECF3] last:border-r-0 pointer-events-none ${
                            d.isToday ? 'bg-sky-50/20' : ''
                          }`}
                        />
                      ))}

                      {/* Empty Placeholder if no orders */}
                      {assignedOrders.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-slate-400 font-sans italic">
                          No orders scheduled for this period
                        </div>
                      )}

                      {/* Scheduled Work Order Bars */}
                      {assignedOrders.map((wo) => {
                        const isDraggingThis = dragState?.woId === wo.id;
                        const effectiveStartDate = isDraggingThis ? dragState.currentStartDate : wo.start_date;
                        const effectiveDueDate = isDraggingThis ? dragState.currentDueDate : wo.due_date;

                        // Calculate column positions
                        const totalDays = timelineDates.length;
                        
                        // Find index of effectiveStartDate
                        let startIdx = timelineDates.findIndex(d => d.dateStr === effectiveStartDate);
                        if (startIdx === -1) {
                          startIdx = effectiveStartDate < startDateRange ? 0 : totalDays - 1;
                        }

                        // Find index of effectiveDueDate
                        let endIdx = timelineDates.findIndex(d => d.dateStr === effectiveDueDate);
                        if (endIdx === -1) {
                          endIdx = effectiveDueDate > endDateRange ? totalDays - 1 : 0;
                        }

                        // Clamp span
                        startIdx = Math.max(0, Math.min(totalDays - 1, startIdx));
                        endIdx = Math.max(startIdx, Math.min(totalDays - 1, endIdx));

                        const leftPercent = (startIdx / totalDays) * 100;
                        const widthPercent = Math.max(2.5, ((endIdx - startIdx + 1) / totalDays) * 100);

                        const lane = orderLanes.get(wo.id) || 0;
                        const topPx = 14 + lane * 34;

                        const styles = getStatusBadge(wo.status);
                        const isOverdue = wo.due_date < todayStr && wo.status !== 'Completed';
                        const progressPercent = wo.planned_quantity > 0 
                          ? Math.min(100, Math.round((wo.produced_quantity / wo.planned_quantity) * 100))
                          : 0;

                        return (
                          <div
                            key={wo.id}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              top: `${topPx}px`,
                              height: '28px'
                            }}
                            onMouseEnter={() => setHoveredWoId(wo.id)}
                            onMouseLeave={() => setHoveredWoId(null)}
                            onClick={() => onOpenDetailModal(wo.id)}
                            className={`absolute z-10 px-2 py-1 rounded-[30px] border flex items-center justify-between text-xs font-medium cursor-pointer transition-shadow select-none group ${
                              styles.bg
                            } ${isOverdue ? 'border-l-4 border-l-rose-500' : ''} ${
                              isDraggingThis ? 'opacity-90 ring-2 ring-sky-500' : 'hover:ring-1 hover:ring-sky-400'
                            }`}
                            title={`${wo.work_order_number} — ${wo.product_name} | ${effectiveStartDate} to ${effectiveDueDate} | ${progressPercent}% completed`}
                          >
                            {/* Inline Progress Fill (proportional to good units produced) */}
                            {wo.status === 'In Progress' && progressPercent > 0 && (
                              <div
                                style={{ width: `${progressPercent}%` }}
                                className={`absolute left-0 top-0 bottom-0 rounded-l-[30px] ${progressPercent >= 98 ? 'rounded-r-[30px]' : ''} ${styles.fill} pointer-events-none`}
                              />
                            )}

                            {/* Left Resize Handle (Start Date) */}
                            {canEdit && (
                              <div
                                onPointerDown={(e) => handlePointerDown(e, wo, 'resize-start')}
                                className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-slate-400/20 rounded-l-[30px] z-20"
                                title="Drag to adjust start date"
                              />
                            )}

                            {/* Center Bar Content (draggable for rescheduling) */}
                            <div 
                              onPointerDown={canEdit ? (e) => handlePointerDown(e, wo, 'move') : undefined}
                              className="flex items-center gap-1.5 truncate relative z-10 flex-1 mr-1.5"
                            >
                              {/* Overdue pulsing dot or status dot */}
                              {isOverdue ? (
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                                </span>
                              ) : (
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
                              )}

                              <span className="font-mono text-[11px] font-medium shrink-0">
                                {wo.work_order_number}
                              </span>
                              <span className="truncate text-[11px] text-slate-700">
                                {wo.product_name}
                              </span>
                            </div>

                            {/* Progress percentage pill */}
                            <div className="relative z-10 shrink-0 flex items-center gap-1 text-[10px] font-mono text-slate-600">
                              <span>{progressPercent}%</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Right Resize Handle (Due Date) */}
                            {canEdit && (
                              <div
                                onPointerDown={(e) => handlePointerDown(e, wo, 'resize-end')}
                                className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-slate-400/20 rounded-r-[30px] z-20"
                                title="Drag to adjust due date"
                              />
                            )}

                            {/* Rich Tooltip on Hover */}
                            {hoveredWoId === wo.id && !dragState && (
                              <div className="absolute left-0 top-full mt-1.5 z-30 w-72 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 pointer-events-none text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-sky-400 font-medium">{wo.work_order_number}</span>
                                  <span className="px-2 py-0.5 rounded-[30px] text-[10px] font-medium bg-slate-800 text-slate-300">
                                    {wo.status}
                                  </span>
                                </div>
                                <div className="font-medium text-slate-100">{wo.product_name}</div>
                                
                                <div className="pt-1.5 border-t border-slate-800 grid grid-cols-2 gap-1.5 text-[11px] text-slate-400 font-mono">
                                  <div>Target: <strong className="text-slate-200">{wo.planned_quantity}</strong></div>
                                  <div>Good: <strong className="text-emerald-400">{wo.produced_quantity}</strong></div>
                                  <div>Start: <strong className="text-slate-200">{wo.start_date}</strong></div>
                                  <div>Due: <strong className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-200'}>{wo.due_date}</strong></div>
                                </div>

                                {isOverdue && (
                                  <div className="pt-1 text-[10px] text-rose-400 font-medium flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>Overdue by schedule target date</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
