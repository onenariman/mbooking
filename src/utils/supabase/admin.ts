import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { requireSupabasePublicEnv } from "@/src/utils/supabase/env";

const { supabaseUrl } = requireSupabasePublicEnv("Admin Supabase client");
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase service role env vars are required for admin client");
}

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
