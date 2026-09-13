import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CalendarRange,
  Hammer, 
  CheckCircle, 
  Cpu, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export type TabType = 'dashboard' | 'work-orders' | 'schedule' | 'production' | 'quality' | 'machines';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  counts?: {
    workOrders: number;
    runningMachines: number;
    inProgressOrders: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  counts
}) => {
  const { role } = useAuth();

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
      id: 'schedule',
      label: 'Gantt Schedule',
      icon: CalendarRange,
      roles: ['Admin', 'Supervisor'],
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
  ];

  const getRoleAccentBorder = (r: UserRole) => {
    switch (r) {
      case 'Admin': return 'border-l-purple-600';
      case 'Supervisor': return 'border-l-blue-600';
      case 'Operator': return 'border-l-emerald-600';
      case 'Quality Inspector': return 'border-l-amber-600';
      default: return 'border-l-slate-400';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-61px)]">
      
      {/* Navigation Section */}
      <div className="p-4 space-y-1.5 flex-1">
        <div className="text-[11px] font-medium text-slate-400 px-3 mb-3 font-sans">
          Operational Control
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAllowed = item.roles.includes(role);

          if (!isAllowed) return null;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[30px] text-xs font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                <span>{item.label}</span>
              </div>

              {item.badge ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-[30px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Role Context Display (Read-Only) */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className={`rounded-xl bg-white border border-slate-200 p-3 border-l-4 ${getRoleAccentBorder(role)}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-sans font-medium text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Authenticated Role</span>
          </div>
          <div className="text-xs font-medium text-slate-900 font-sans mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {role}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            {role === 'Operator' && 'Granted access to shift production recording and machine telemetry.'}
            {role === 'Quality Inspector' && 'Granted access to quality assurance inspection audits.'}
            {role === 'Supervisor' && 'Full line supervisory control across orders, shifts, and QC.'}
            {role === 'Admin' && 'Full administrator credentials across system settings and operations.'}
          </div>
        </div>
      </div>

    </aside>
  );
};
