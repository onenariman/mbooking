import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";
import { requireSupabasePublicEnv } from "@/src/utils/supabase/env";

export const createClient = () =>
{
  const { supabaseKey, supabaseUrl } = requireSupabasePublicEnv(
    "Browser Supabase client",
  );

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
};
