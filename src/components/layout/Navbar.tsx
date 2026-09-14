import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  LogOut,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../common/Logo';

interface NavbarProps {
  onOpenNewWorkOrder: () => void;
  onOpenNewProduction: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewWorkOrder,
  onOpenNewProduction,
  onToggleMobileSidebar
}) => {
  const { profile, user, role, signOut } = useAuth();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case 'Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Supervisor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Operator':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Quality Inspector':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="shrink-0 sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Mobile hamburger button & Brand Identity */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <Logo size="sm" />
        </div>

        {/* Center: System Telemetry (Live Clock) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[30px] bg-slate-50 border border-slate-200 text-xs font-mono font-normal text-slate-700 tabular-nums">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{time}</span>
          </div>
        </div>

        {/* Right: Authenticated User & Actions */}
        <div className="flex items-center gap-3">
          
          {/* Action: Log Production */}
          {(role === 'Operator' || role === 'Supervisor' || role === 'Admin') && (
            <button
              onClick={onOpenNewProduction}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-[30px] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Production</span>
            </button>
          )}

          {/* Action: New Work Order */}
          {(role === 'Supervisor' || role === 'Admin') && (
            <button
              onClick={onOpenNewWorkOrder}
              className="hidden lg:flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-[30px] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Work Order</span>
            </button>
          )}

          {/* User Profile & Role Display */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-slate-800 leading-tight">
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded-[30px] border ${getRoleBadgeStyle(role)}`}>
                  {role}
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-[30px] bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-medium font-mono">
              {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={signOut}
              className="p-2 rounded-[30px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
