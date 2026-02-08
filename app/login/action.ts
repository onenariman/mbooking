"use server";

import { createClient } from "@/src/utils/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Если ошибка, можно прокинуть её в URL и показать пользователю
    redirect("/login?error=auth-failed");
  }

  // Перенаправляем на главную после успеха
  redirect("/");
}
