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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[30px] bg-blue-50 text-blue-600 border border-blue-100">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-900 font-display">Supabase Connection &amp; Database Setup</h3>
              <p className="text-xs text-slate-500 font-sans font-normal">Manage PostgreSQL connection and verify database tables</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-[30px] hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Connection Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            status?.connected && status?.tablesFound
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : status?.connected && !status?.tablesFound
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {testing ? (
              <RefreshCw className="w-5 h-5 animate-spin shrink-0 text-blue-600" />
            ) : status?.connected && status?.tablesFound ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : status?.connected && !status?.tablesFound ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            ) : (
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
            )}

            <div className="flex-1 text-xs leading-relaxed font-sans">
              <div className="font-medium text-sm mb-0.5 font-display">
                {testing ? 'Testing connection...' : status?.connected && status?.tablesFound ? 'Fully Connected & Ready' : status?.connected ? 'Database Schema Required' : 'Not Connected'}
              </div>
              <div className="font-normal">{status?.message || 'Press "Test Connection" to diagnose the connection status.'}</div>
              {status?.latencyMs && (
                <div className="mt-1 text-[11px] font-mono opacity-80 tabular-nums">Response latency: {status.latencyMs}ms</div>
              )}
            </div>

            <button
              onClick={testCurrentConnection}
              disabled={testing}
              className="px-3.5 py-1.5 text-xs font-medium rounded-[30px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-blue-600' : ''}`} />
              Test
            </button>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5 font-sans">
                <Server className="w-3.5 h-3.5 text-blue-600" />
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5 font-sans">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-[30px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white font-mono transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-sans font-normal">
                Found in your Supabase Dashboard under <span className="text-slate-600 font-medium">Project Settings &gt; API</span>.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline cursor-pointer font-sans font-medium"
              >
                Clear Credentials
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[30px] transition-colors cursor-pointer font-sans"
              >
                Save &amp; Reload Client
              </button>
            </div>
          </form>

          {/* Quick SQL Schema Step */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                <FileCode2 className="w-4 h-4 text-blue-600" />
                Supabase SQL Schema Script
              </div>
              <button
                onClick={copySql}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-blue-600 rounded-[30px] border border-slate-200 transition-colors cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
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
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              To setup or repair your database, copy this SQL and run it in the{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 inline-flex items-center gap-1 hover:underline font-medium"
              >
                Supabase SQL Editor <ExternalLink className="w-3 h-3" />
              </a>.
              It creates tables (<code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-[30px] font-mono text-[11px]">work_orders</code>, <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-[30px] font-mono text-[11px]">machines</code>, <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-[30px] font-mono text-[11px]">production_entries</code>, etc.), triggers, recalculations, and RLS policies.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-[30px] transition-colors border border-slate-200 cursor-pointer font-sans"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
