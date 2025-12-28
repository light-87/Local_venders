import { createClient } from '@supabase/supabase-js';

/**
 * Admin/Service Role Supabase client
 * ONLY use this in trusted server contexts (API routes, cron jobs)
 * This client bypasses Row Level Security
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
