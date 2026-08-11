import { createClient } from "@supabase/supabase-js";

// Server-only, bypasses RLS. The keys domain has no real login (see
// lib/keys — DEMO_USER_ID), so there's no auth.uid() session to scope a
// normal RLS-respecting query to; this is the same pattern api-key-manager
// used for its /api/verify route, applied here to the whole keys domain.
//
// The env check is deliberately deferred to call time (not module load) so
// that importing this module doesn't crash Next's build-time route
// analysis in environments where the secret isn't configured yet.
export function createServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
