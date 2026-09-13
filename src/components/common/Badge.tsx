import React from 'react';

interface BadgeProps {
  status: string;
  type?: 'status' | 'priority' | 'machine' | 'shift';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, type = 'status', size = 'sm' }) => {
  const getColors = () => {
    switch (status) {
      // Work Order Status
      case 'Pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'In Progress':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';

      // Priorities
      case 'Low':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Urgent':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/40 font-bold';

      // Machine Status
      case 'Running':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Idle':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Maintenance':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Offline':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';

      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/40';
    }
  };

  const sizeClass = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${getColors()} ${sizeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
};
