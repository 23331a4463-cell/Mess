import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Shield, 
  UserCheck,
  Server,
  Layers,
  FileCode2
} from 'lucide-react';
import { 
  supabaseUrl, 
  supabaseAnonKey, 
  checkSupabaseConnection, 
  ConnectionStatus 
} from '../../lib/supabase';
import { UserRole } from '../../types';

interface SettingsViewProps {
  onOpenConnectionModal: () => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenConnectionModal,
  currentRole,
  onRoleChange
}) => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [schemaSql, setSchemaSql] = useState('');

  useEffect(() => {
    checkConn();
    fetch('/supabase_schema.sql')
      .then(res => res.text())
      .then(text => setSchemaSql(text))
      .catch(() => {});
  }, []);

  const checkConn = async () => {
    setLoading(true);
    const res = await checkSupabaseConnection();
    setStatus(res);
    setLoading(false);
  };

  const copySql = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const maskedKey = supabaseAnonKey 
    ? `${supabaseAnonKey.slice(0, 12)}...${supabaseAnonKey.slice(-8)}`
    : 'Not configured';

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-400" />
          System Settings &amp; Supabase Integration
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          PostgreSQL database connectivity, schema verification, security policies, and user role testing
        </p>
      </div>

      {/* Supabase Connection Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Supabase PostgreSQL Backend</h3>
              <p className="text-xs text-slate-400">Direct connection via @supabase/supabase-js</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkConn}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Diagnose</span>
            </button>
            <button
              onClick={onOpenConnectionModal}
              className="px-3.5 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md transition-colors"
            >
              Configure Credentials
            </button>
          </div>
        </div>

        {/* Status Box */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
          status?.connected && status?.tablesFound
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : status?.connected && !status?.tablesFound
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-sky-400 shrink-0" />
          ) : status?.connected && status?.tablesFound ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div className="flex-1 leading-relaxed">
            <div className="font-semibold text-white mb-0.5">
              {status?.connected && status?.tablesFound ? 'Supabase Database Connected & Verified' : status?.connected ? 'Database Schema Missing' : 'Connection Inactive'}
            </div>
            <div>{status?.message}</div>
            {status?.latencyMs && (
              <div className="mt-1 text-[11px] text-slate-400">Ping latency: {status.latencyMs}ms</div>
            )}
          </div>
        </div>

        {/* Credentials Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-500 font-medium">Supabase Project URL:</span>
            <div className="font-mono text-slate-200 truncate font-semibold">
              {supabaseUrl || 'None (set VITE_SUPABASE_URL in .env)'}
            </div>
          </div>
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-500 font-medium">Supabase Anon Key:</span>
            <div className="font-mono text-slate-200 truncate font-semibold">
              {maskedKey}
            </div>
          </div>
        </div>

        {/* Database Schema Setup Quick Action */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <FileCode2 className="w-4 h-4 text-sky-400" />
              <span>Full SQL Schema (Tables, Recalculation Triggers &amp; RLS)</span>
            </div>
            <button
              onClick={copySql}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg border border-slate-700 transition-colors"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Schema</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Run this in the Supabase SQL Editor to initialize all 5 tables: <code className="text-slate-300">profiles</code>, <code className="text-slate-300">machines</code>, <code className="text-slate-300">work_orders</code>, <code className="text-slate-300">production_entries</code>, and <code className="text-slate-300">quality_inspections</code>, along with triggers that automatically calculate <code className="text-slate-300">produced_quantity</code> and <code className="text-slate-300">status</code>.
          </p>
        </div>
      </div>

      {/* Role Management Info Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Role-Based Access Control (RBAC)</h3>
            <p className="text-xs text-slate-400">Simulation &amp; testing of factory user personas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          <div 
            onClick={() => onRoleChange('Admin')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentRole === 'Admin' 
                ? 'bg-sky-500/10 border-sky-500/40 text-white' 
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-sky-400 flex items-center justify-between">
              <span>Admin</span>
              {currentRole === 'Admin' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Full control over all work orders, machines, and database logs.</p>
          </div>

          <div 
            onClick={() => onRoleChange('Supervisor')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentRole === 'Supervisor' 
                ? 'bg-sky-500/10 border-sky-500/40 text-white' 
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-sky-400 flex items-center justify-between">
              <span>Supervisor</span>
              {currentRole === 'Supervisor' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Create, edit, and schedule work orders. Monitor live KPIs.</p>
          </div>

          <div 
            onClick={() => onRoleChange('Operator')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentRole === 'Operator' 
                ? 'bg-sky-500/10 border-sky-500/40 text-white' 
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-sky-400 flex items-center justify-between">
              <span>Operator</span>
              {currentRole === 'Operator' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">View active work orders and record shift production &amp; scrap.</p>
          </div>

          <div 
            onClick={() => onRoleChange('Quality Inspector')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentRole === 'Quality Inspector' 
                ? 'bg-sky-500/10 border-sky-500/40 text-white' 
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-sky-400 flex items-center justify-between">
              <span>Quality Inspector</span>
              {currentRole === 'Quality Inspector' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Perform QC sample audits, defect categorization, and scrap logging.</p>
          </div>

        </div>
      </div>

    </div>
  );
};
