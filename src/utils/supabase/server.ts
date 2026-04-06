import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";
import { requireSupabasePublicEnv } from "@/src/utils/supabase/env";

// Добавляем async к функции
export const createClient = async () => {
  // Дожидаемся получения кук (Next.js 15 требует await)
  const cookieStore = await cookies();
  const { supabaseKey, supabaseUrl } = requireSupabasePublicEnv("Server Supabase client");

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Это нормально для серверных компонентов
        }
      },
    },
  });
};
