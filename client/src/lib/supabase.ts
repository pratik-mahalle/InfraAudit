import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// BUG-002 fix: Fail fast when Supabase env vars are missing.
// Previously used a placeholder URL ('placeholder.supabase.co') which could
// be registered by an attacker to intercept auth traffic. Now we throw a
// clear error so developers know to configure .env immediately.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[InfraAudit] Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). ' +
    'Authentication will NOT work. Copy .env.example to .env and fill in your Supabase credentials.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

