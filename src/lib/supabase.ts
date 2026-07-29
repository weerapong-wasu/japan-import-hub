// ============================================================
// SUPABASE SERVER CLIENT — service-role key, server use ONLY.
// Import this only inside src/pages/api/* (never in .astro
// templates that render client HTML with secrets).
// ============================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV, isSupabaseConfigured } from './env';

let client: SupabaseClient | null = null;

/** Returns a singleton Supabase client, or null when not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(ENV.supabaseUrl!, ENV.supabaseServiceRoleKey!, {
      auth: { persistSession: false },
    });
  }
  return client;
}
