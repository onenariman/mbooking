import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { Database } from "@/types/database.types";

export const updateSession = async (request: NextRequest) => {
  // 1. Создаем начальный ответ
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Инициализируем клиент Supabase
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 3. Получаем пользователя
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. ЛОГИКА ЗАМКА:

  // Если пользователя НЕТ и он пытается зайти на любую страницу, кроме /login
  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Если пользователь ЕСТЬ и он пытается зайти на /login — отправляем его на главную
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
};
