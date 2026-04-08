import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { requireSupabasePublicEnv } from "@/src/utils/supabase/env";

const { supabaseUrl } = requireSupabasePublicEnv("Admin Supabase client");
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase service role env vars are required for admin client");
}

const decodeJwtRole = (token: string) => {
  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    const parsed = JSON.parse(payload) as { role?: unknown };
    return typeof parsed.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
};

if (
  supabaseServiceRoleKey.startsWith("sb_publishable_") ||
  decodeJwtRole(supabaseServiceRoleKey) === "anon"
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY points to a public/anon key. Replace it with the real service_role or sb_secret key from Supabase Settings -> API Keys.",
  );
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
