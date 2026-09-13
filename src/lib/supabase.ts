import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite environment or localStorage override for dynamic connection configuration
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('MINI_MES_SUPABASE_URL') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('MINI_MES_SUPABASE_KEY') : null;

export const supabaseUrl = (storedUrl || envUrl || '').trim();
export const supabaseAnonKey = (storedKey || envKey || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('your-project')
);

// Graceful client creation: if not configured yet, use dummy placeholder to prevent runtime crash on boot
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export let supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

export function updateSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('MINI_MES_SUPABASE_URL', url.trim());
    localStorage.setItem('MINI_MES_SUPABASE_KEY', key.trim());
    window.location.reload();
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('MINI_MES_SUPABASE_URL');
    localStorage.removeItem('MINI_MES_SUPABASE_KEY');
    window.location.reload();
  }
}

export interface ConnectionStatus {
  connected: boolean;
  message: string;
  tablesFound?: boolean;
  latencyMs?: number;
}

export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Supabase credentials not set. Please provide your Supabase URL and Anon Key.',
      tablesFound: false
    };
  }

  const start = performance.now();
  try {
    // Attempt to query the machines table
    const { data, error } = await supabase
      .from('machines')
      .select('id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      // Check if the table does not exist yet (relation does not exist)
      if (error.code === '42P01' || error.message?.toLowerCase().includes('relation') || error.message?.toLowerCase().includes('does not exist')) {
        return {
          connected: true,
          message: 'Connected to Supabase, but database tables are not yet created. Please run the SQL schema in your Supabase SQL Editor.',
          tablesFound: false,
          latencyMs
        };
      }
      return {
        connected: false,
        message: `Supabase connection error: ${error.message}`,
        tablesFound: false,
        latencyMs
      };
    }

    return {
      connected: true,
      message: 'Connected successfully to Supabase database.',
      tablesFound: true,
      latencyMs
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Network error while attempting to reach Supabase.',
      tablesFound: false
    };
  }
}
