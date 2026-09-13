import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Hammer, 
  CheckCircle, 
  Cpu, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../../types';

export type TabType = 'dashboard' | 'work-orders' | 'production' | 'quality' | 'machines' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentRole: UserRole;
  counts?: {
    workOrders: number;
    runningMachines: number;
    inProgressOrders: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  counts
}) => {
  const menuItems: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: UserRole[];
    badge?: string | number;
  }[] = [
    {
      id: 'dashboard',
      label: 'Live Dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Supervisor', 'Operator', 'Quality Inspector'],
    },
    {
      id: 'work-orders',
      label: 'Work Orders',
      icon: ClipboardList,
      roles: ['Admin', 'Supervisor', 'Operator', 'Quality Inspector'],
      badge: counts?.inProgressOrders ? `${counts.inProgressOrders} active` : undefined,
    },
    {
      id: 'production',
      label: 'Production Logs',
      icon: Hammer,
      roles: ['Admin', 'Supervisor', 'Operator'],
    },
    {
      id: 'quality',
      label: 'Quality Inspection',
      icon: CheckCircle,
      roles: ['Admin', 'Supervisor', 'Quality Inspector'],
    },
    {
      id: 'machines',
      label: 'Machine Registry',
      icon: Cpu,
      roles: ['Admin', 'Supervisor', 'Operator'],
      badge: counts?.runningMachines ? `${counts.runningMachines} online` : undefined,
    },
    {
      id: 'settings',
      label: 'System & Supabase',
      icon: Settings,
      roles: ['Admin', 'Supervisor', 'Operator', 'Quality Inspector'],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-61px)]">
      
      {/* Navigation Section */}
      <div className="p-4 space-y-1 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
          Factory Operations
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAllowed = item.roles.includes(currentRole);

          if (!isAllowed) return null;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <span>{item.label}</span>
              </div>

              {item.badge ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Role Context Pill */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
          <div className="text-[11px] font-medium text-slate-400">Current Role Mode</div>
          <div className="text-xs font-bold text-sky-400 mt-0.5">{currentRole}</div>
          <div className="text-[10px] text-slate-500 mt-1 leading-snug">
            {currentRole === 'Admin' && 'Full system management & database control.'}
            {currentRole === 'Supervisor' && 'Work order scheduling and shop-floor tracking.'}
            {currentRole === 'Operator' && 'Production output and machine operations.'}
            {currentRole === 'Quality Inspector' && 'Quality checks, tolerances, and defect audits.'}
          </div>
        </div>
      </div>

    </aside>
  );
};
