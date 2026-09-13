import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  Activity, 
  ShieldAlert, 
  Database, 
  UserCheck, 
  Clock, 
  Plus,
  Radio
} from 'lucide-react';
import { UserRole } from '../../types';
import { checkSupabaseConnection, ConnectionStatus } from '../../lib/supabase';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenConnectionModal: () => void;
  onOpenNewWorkOrder: () => void;
  onOpenNewProduction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onOpenConnectionModal,
  onOpenNewWorkOrder,
  onOpenNewProduction
}) => {
  const [time, setTime] = useState<string>('');
  const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkSupabaseConnection().then(setConnStatus);
  }, []);

  const roles: UserRole[] = ['Supervisor', 'Operator', 'Quality Inspector', 'Admin'];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-600/20 text-white font-bold tracking-wider">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">MINI MES</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                PROD v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">Manufacturing Execution System</p>
          </div>
        </div>

        {/* Center: System Clock & Connection Badge */}
        <div className="flex items-center gap-3">
          
          {/* Live Clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{time}</span>
          </div>

          {/* Supabase Connection Status Pill */}
          <button
            onClick={onOpenConnectionModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              connStatus?.connected && connStatus.tablesFound
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : connStatus?.connected && !connStatus.tablesFound
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 animate-pulse'
            }`}
            title="Click to check Supabase connection and database schema"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {connStatus?.connected && connStatus.tablesFound
                ? 'Supabase Online'
                : connStatus?.connected
                ? 'Setup Tables'
                : 'Connect Supabase'}
            </span>
            <span className={`w-2 h-2 rounded-full ${
              connStatus?.connected && connStatus.tablesFound ? 'bg-emerald-400' : connStatus?.connected ? 'bg-amber-400' : 'bg-rose-400'
            }`} />
          </button>
        </div>

        {/* Right: Role Switcher & Fast Actions */}
        <div className="flex items-center gap-3">
          
          {/* Role selector dropdown */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-slate-200">
                  Role: {r}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Production Log Action */}
          {(currentRole === 'Operator' || currentRole === 'Supervisor' || currentRole === 'Admin') && (
            <button
              onClick={onOpenNewProduction}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md shadow-sky-600/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Production</span>
            </button>
          )}

          {/* Quick Work Order Action */}
          {(currentRole === 'Supervisor' || currentRole === 'Admin') && (
            <button
              onClick={onOpenNewWorkOrder}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Work Order</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
