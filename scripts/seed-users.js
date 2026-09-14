/**
 * Standalone Node.js script to seed the 4 pre-confirmed demo users into Supabase Auth.
 * 
 * USAGE:
 *   node scripts/seed-users.js <SUPABASE_SERVICE_ROLE_KEY>
 * or set SUPABASE_SERVICE_ROLE_KEY in your environment before running:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 *   node scripts/seed-users.js
 * 
 * IMPORTANT: NEVER commit the service-role key or expose it in frontend code.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Attempt to read VITE_SUPABASE_URL from .env if present
let supabaseUrl = process.env.VITE_SUPABASE_URL || '';
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2] || '';

if (!supabaseUrl && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = trimmed.replace('VITE_SUPABASE_URL=', '').trim();
    }
    if (!serviceRoleKey && trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      serviceRoleKey = trimmed.replace('SUPABASE_SERVICE_ROLE_KEY=', '').trim();
    }
  }
}

if (!supabaseUrl) {
  console.error('Error: Supabase URL not found. Set VITE_SUPABASE_URL in .env or as an environment variable.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('Error: Supabase Service Role Key required.');
  console.error('Usage: node scripts/seed-users.js <SUPABASE_SERVICE_ROLE_KEY>');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const SEED_USERS = [
  {
    email: 'admin@factory.com',
    password: 'Admin123',
    full_name: 'Plant Administrator',
    role: 'Admin'
  },
  {
    email: 'supervisor@factory.com',
    password: 'Supervisor123',
    full_name: 'Production Supervisor',
    role: 'Supervisor'
  },
  {
    email: 'operator@factory.com',
    password: 'Operator123',
    full_name: 'Senior Machine Operator',
    role: 'Operator'
  },
  {
    email: 'quality@factory.com',
    password: 'Quality123',
    full_name: 'Quality Assurance Lead',
    role: 'Quality Inspector'
  }
];

async function seedUsers() {
  console.log(`\nConnecting to Supabase at: ${supabaseUrl}`);
  console.log('Seeding pre-confirmed demo users into auth.users...\n');

  for (const u of SEED_USERS) {
    try {
      // 1. Check if user already exists
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      const existing = listData.users.find(user => user.email === u.email);

      if (existing) {
        console.log(`User ${u.email} already exists. Updating password and metadata...`);
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: u.password,
          email_confirm: true,
          user_metadata: {
            full_name: u.full_name,
            role: u.role
          }
        });
        if (updateError) throw updateError;
        
        // Also ensure profiles table row is updated
        await supabaseAdmin.from('profiles').upsert({
          id: existing.id,
          full_name: u.full_name,
          email: u.email,
          role: u.role
        });
        console.log(`[OK] Updated ${u.role}: ${u.email}`);
      } else {
        // 2. Create user with pre-confirmed email
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: {
            full_name: u.full_name,
            role: u.role
          }
        });
        if (createError) throw createError;

        // Ensure profile is inserted (in case trigger wasn't active yet)
        if (createData.user) {
          await supabaseAdmin.from('profiles').upsert({
            id: createData.user.id,
            full_name: u.full_name,
            email: u.email,
            role: u.role
          });
        }
        console.log(`[OK] Created ${u.role}: ${u.email}`);
      }
    } catch (err) {
      console.error(`[FAIL] ${u.email}:`, err.message);
    }
  }

  console.log('\nSeed users processing complete.');
}

seedUsers();
