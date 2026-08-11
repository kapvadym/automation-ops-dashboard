import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
}

// Anon key + permissive RLS, same deliberate simplification as the 3
// original projects this covers (rag, workflow, agent) — none of these
// tables hold real user data. See supabase/schema.sql.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
