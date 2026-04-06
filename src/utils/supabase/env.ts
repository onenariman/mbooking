const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;

const getSupabasePublishableKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const getSupabasePublicEnv = () => ({
  supabaseKey: getSupabasePublishableKey(),
  supabaseUrl: getSupabaseUrl(),
});

export const requireSupabasePublicEnv = (
  clientName = "Supabase client",
) => {
  const { supabaseKey, supabaseUrl } = getSupabasePublicEnv();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `${clientName} requires NEXT_PUBLIC_SUPABASE_URL and either ` +
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY`,
    );
  }

  return { supabaseKey, supabaseUrl };
};
