import React from 'react';
import { 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  PauseCircle, 
  Wrench, 
  PowerOff, 
  AlertTriangle, 
  Flame, 
  Shield 
} from 'lucide-react';

interface BadgeProps {
  status: string;
  type?: 'status' | 'priority' | 'machine' | 'shift' | 'role';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      // Work Order Statuses
      case 'Pending':
        return {
          colors: 'bg-amber-50 text-amber-800 border-amber-200/80',
          icon: <Clock className="w-3 h-3 text-amber-600 shrink-0" />
        };
      case 'In Progress':
        return {
          colors: 'bg-blue-50 text-blue-800 border-blue-200/80',
          icon: <PlayCircle className="w-3 h-3 text-blue-600 shrink-0" />
        };
      case 'Completed':
        return {
          colors: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        };
      case 'Cancelled':
        return {
          colors: 'bg-rose-50 text-rose-800 border-rose-200/80',
          icon: <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
        };

      // Machine Operating Statuses
      case 'Running':
        return {
          colors: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          icon: (
            <span className="relative flex h-2 w-2 mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
          )
        };
      case 'Idle':
        return {
          colors: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <PauseCircle className="w-3 h-3 text-slate-500 shrink-0" />
        };
      case 'Maintenance':
        return {
          colors: 'bg-amber-50 text-amber-800 border-amber-200/80',
          icon: <Wrench className="w-3 h-3 text-amber-600 shrink-0" />
        };
      case 'Offline':
        return {
          colors: 'bg-rose-50 text-rose-800 border-rose-200/80',
          icon: <PowerOff className="w-3 h-3 text-rose-600 shrink-0" />
        };

      // Work Order Priorities
      case 'Urgent':
        return {
          colors: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <Flame className="w-3 h-3 text-rose-600 shrink-0 animate-pulse" />
        };
      case 'High':
        return {
          colors: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
        };
      case 'Medium':
        return {
          colors: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
        };
      case 'Low':
        return {
          colors: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
        };

      // User Roles
      case 'Admin':
        return {
          colors: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Shield className="w-3 h-3 text-purple-600 shrink-0" />
        };
      case 'Supervisor':
        return {
          colors: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Shield className="w-3 h-3 text-blue-600 shrink-0" />
        };
      case 'Operator':
        return {
          colors: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
        };
      case 'Quality Inspector':
        return {
          colors: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Shield className="w-3 h-3 text-amber-600 shrink-0" />
        };

      default:
        return {
          colors: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClass = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-sans font-medium rounded-[30px] border ${config.colors} ${sizeClass} tracking-tight`}>
      {config.icon}
      <span>{status}</span>
    </span>
  );
};
