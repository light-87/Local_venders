import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client with vendor context for RLS
 * This sets the app.current_vendor_id for Row Level Security
 */
export async function createClientWithVendor(vendorId: string) {
  const supabase = await createClient();

  // Set the vendor_id for RLS policies
  await supabase.rpc('set_config', {
    setting_name: 'app.current_vendor_id',
    setting_value: vendorId,
  });

  return supabase;
}
