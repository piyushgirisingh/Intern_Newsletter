import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }

  client ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}

export function requireSupabaseClient(): SupabaseClient {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return supabase;
}
