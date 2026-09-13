import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Key, 
  Server, 
  X,
  FileCode2,
  ShieldAlert
} from 'lucide-react';
import { 
  supabaseUrl, 
  supabaseAnonKey, 
  updateSupabaseConfig, 
  clearSupabaseConfig, 
  checkSupabaseConnection, 
  ConnectionStatus 
} from '../../lib/supabase';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange?: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, onConnectionChange }) => {
  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState(supabaseAnonKey);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [schemaSql, setSchemaSql] = useState<string>('');

  useEffect(() => {
    // Load schema file content if available
    fetch('/supabase_schema.sql')
      .then(res => res.text())
      .then(text => setSchemaSql(text))
      .catch(() => {});
    
    if (isOpen) {
      testCurrentConnection();
    }
  }, [isOpen]);

  const testCurrentConnection = async () => {
    setTesting(true);
    const res = await checkSupabaseConnection();
    setStatus(res);
    setTesting(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig(url, key);
    if (onConnectionChange) onConnectionChange();
  };

  const handleReset = () => {
    clearSupabaseConfig();
    setUrl('');
    setKey('');
    if (onConnectionChange) onConnectionChange();
  };

  const copySql = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Supabase Connection & Database Setup</h3>
              <p className="text-xs text-slate-400">Manage PostgreSQL connection and verify database tables</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Connection Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            status?.connected && status?.tablesFound
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : status?.connected && !status?.tablesFound
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {testing ? (
              <RefreshCw className="w-5 h-5 animate-spin shrink-0 text-sky-400" />
            ) : status?.connected && status?.tablesFound ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : status?.connected && !status?.tablesFound ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            )}

            <div className="flex-1 text-xs leading-relaxed">
              <div className="font-semibold text-sm text-white mb-0.5">
                {testing ? 'Testing connection...' : status?.connected && status?.tablesFound ? 'Fully Connected & Ready' : status?.connected ? 'Database Schema Required' : 'Not Connected'}
              </div>
              <div>{status?.message || 'Press "Test Connection" to diagnose the connection status.'}</div>
              {status?.latencyMs && (
                <div className="mt-1 text-[11px] text-slate-400">Response latency: {status.latencyMs}ms</div>
              )}
            </div>

            <button
              onClick={testCurrentConnection}
              disabled={testing}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              Test
            </button>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-sky-400" />
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 font-mono transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Found in your Supabase Dashboard under <span className="text-slate-400 font-medium">Project Settings &gt; API</span>.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
              >
                Clear Credentials
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/20 transition-colors"
              >
                Save &amp; Reload Client
              </button>
            </div>
          </form>

          {/* Quick SQL Schema Step */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <FileCode2 className="w-4 h-4 text-sky-400" />
                Supabase SQL Schema Script
              </div>
              <button
                onClick={copySql}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg border border-slate-700 transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied SQL!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Complete SQL
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              To setup or repair your database, copy this SQL and run it in the{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 inline-flex items-center gap-1 hover:underline font-medium"
              >
                Supabase SQL Editor <ExternalLink className="w-3 h-3" />
              </a>.
              It creates tables (<code className="text-slate-300">work_orders</code>, <code className="text-slate-300">machines</code>, <code className="text-slate-300">production_entries</code>, etc.), triggers, recalculations, and RLS policies.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
