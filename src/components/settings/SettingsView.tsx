import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Shield, 
  UserCheck,
  FileCode2,
  Lock,
  User as UserIcon,
  Mail,
  Key
} from 'lucide-react';
import { 
  supabaseUrl, 
  supabaseAnonKey, 
  checkSupabaseConnection, 
  ConnectionStatus 
} from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../common/Badge';

interface SettingsViewProps {
  onOpenConnectionModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenConnectionModal,
}) => {
  const { user, profile, role, signOut } = useAuth();
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
        <h2 className="text-xl font-medium text-[#1E2939] tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-600" />
          System Settings &amp; Supabase Integration
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          PostgreSQL database connectivity, schema verification, RLS policies, and authenticated session
        </p>
      </div>

      {/* Authenticated User Session Profile Card */}
      <div className="p-6 bg-white border border-[#E8ECF3] rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#1E2939]">Active Authenticated Session</h3>
              <p className="text-xs text-slate-500">Authenticated through Supabase Auth (auth.users &rarr; public.profiles)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[30px] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 bg-[#F7F9FC] border border-[#E8ECF3] rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
              <UserIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>Full Name / Identity</span>
            </div>
            <div className="font-medium text-[#1E2939] truncate text-sm">
              {profile?.full_name || 'Authenticated Operator'}
            </div>
          </div>

          <div className="p-3.5 bg-[#F7F9FC] border border-[#E8ECF3] rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              <span>Email Address</span>
            </div>
            <div className="font-mono text-[#1E2939] truncate text-xs font-medium">
              {user?.email || 'N/A'}
            </div>
          </div>

          <div className="p-3.5 bg-[#F7F9FC] border border-[#E8ECF3] rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span>Assigned System Role</span>
            </div>
            <div>
              <Badge status={role} />
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-[#E8ECF3] rounded-2xl flex items-center gap-2 text-xs text-slate-600">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-[#1E2939] font-medium">RLS Enforcement Active:</strong> Permissions are enforced directly inside PostgreSQL via <code className="text-[#1E2939]">get_my_role()</code> and row-level security policies. Role switching is strictly disabled.
          </span>
        </div>
      </div>

      {/* Supabase Connection Card */}
      <div className="p-6 bg-white border border-[#E8ECF3] rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#1E2939]">Supabase PostgreSQL Backend</h3>
              <p className="text-xs text-slate-500">Direct connection via @supabase/supabase-js</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkConn}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 rounded-[30px] border border-[#E8ECF3] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Diagnose</span>
            </button>
            <button
              onClick={onOpenConnectionModal}
              className="px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-[30px] transition-colors"
            >
              Configure Credentials
            </button>
          </div>
        </div>

        {/* Status Box */}
        <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
          status?.connected && status?.tablesFound
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : status?.connected && !status?.tablesFound
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600 shrink-0" />
          ) : status?.connected && status?.tablesFound ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div className="flex-1 leading-relaxed">
            <div className="font-medium text-[#1E2939] mb-0.5">
              {status?.connected && status?.tablesFound ? 'Supabase Database Connected & Verified' : status?.connected ? 'Database Schema Missing' : 'Connection Inactive'}
            </div>
            <div>{status?.message}</div>
            {status?.latencyMs && (
              <div className="mt-1 text-[11px] text-slate-500">Ping latency: {status.latencyMs}ms</div>
            )}
          </div>
        </div>

        {/* Credentials Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-[#F7F9FC] border border-[#E8ECF3] rounded-2xl space-y-1">
            <span className="text-slate-500 font-medium">Supabase Project URL:</span>
            <div className="font-mono text-[#1E2939] truncate font-medium">
              {supabaseUrl || 'None (set VITE_SUPABASE_URL in .env)'}
            </div>
          </div>
          <div className="p-3.5 bg-[#F7F9FC] border border-[#E8ECF3] rounded-2xl space-y-1">
            <span className="text-slate-500 font-medium">Supabase Anon Key:</span>
            <div className="font-mono text-[#1E2939] truncate font-medium">
              {maskedKey}
            </div>
          </div>
        </div>

        {/* Database Schema Setup Quick Action */}
        <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8ECF3] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-[#1E2939]">
              <FileCode2 className="w-4 h-4 text-sky-600" />
              <span>Full SQL Schema (Tables, Recalculation Triggers &amp; RLS)</span>
            </div>
            <button
              onClick={copySql}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-sky-700 rounded-[30px] border border-[#E8ECF3] transition-colors"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
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
          <p className="text-xs text-slate-500 leading-relaxed">
            Run this in the Supabase SQL Editor to initialize all 5 tables: <code className="text-[#1E2939]">profiles</code>, <code className="text-[#1E2939]">machines</code>, <code className="text-[#1E2939]">work_orders</code>, <code className="text-[#1E2939]">production_entries</code>, and <code className="text-[#1E2939]">quality_inspections</code>, along with triggers that automatically calculate <code className="text-[#1E2939]">produced_quantity</code> and <code className="text-[#1E2939]">status</code>.
          </p>
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Matrix */}
      <div className="p-6 bg-white border border-[#E8ECF3] rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#1E2939]">Factory RBAC Matrix</h3>
            <p className="text-xs text-slate-500">Security permissions granted per role in PostgreSQL Row Level Security</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#E8ECF3] rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F9FC] text-slate-600 border-b border-[#E8ECF3]">
                <th className="py-3 px-4 font-medium">Capability</th>
                <th className="py-3 px-4 font-medium text-center">Admin</th>
                <th className="py-3 px-4 font-medium text-center">Supervisor</th>
                <th className="py-3 px-4 font-medium text-center">Operator</th>
                <th className="py-3 px-4 font-medium text-center">Quality Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF3] text-slate-700">
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-medium">Create &amp; Edit Work Orders</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-slate-400">&minus;</td>
                <td className="py-2.5 px-4 text-center text-slate-400">&minus;</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-medium">Delete Work Orders &amp; Shift Entries</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-slate-400">&minus;</td>
                <td className="py-2.5 px-4 text-center text-slate-400">&minus;</td>
                <td className="py-2.5 px-4 text-center text-slate-400">&minus;</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-medium">Manage Factory Machines</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-slate-400">&minus;</td>
                <td className="py-2.5 px-4 text-center text-slate-400">&minus;</td>
                <td className="py-2.5 px-4 text-center text-slate-400">&minus;</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-medium">Record Shift Production &amp; Scrap</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-slate-400">&minus;</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-medium">Log Quality Inspection Samples</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-slate-400">&minus;</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-medium">View Production Dashboard &amp; Analytics</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">&#10003;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
