import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { Database } from "@/types/database.types";
import { requireSupabasePublicEnv } from "@/src/utils/supabase/env";

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { supabaseKey, supabaseUrl } = requireSupabasePublicEnv(
    "Middleware Supabase client",
  );

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
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
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userRole =
    typeof user?.user_metadata?.role === "string"
      ? user.user_metadata.role
      : null;

  const pathname = request.nextUrl.pathname;
  const isPublicFeedbackRoute = pathname.startsWith("/feedback/");
  const isClientRoute = pathname === "/client" || pathname.startsWith("/client/");
  const isPublicClientRoute =
    pathname.startsWith("/client/login") || pathname.startsWith("/client/invite/");
  const isAdminLoginRoute = pathname.startsWith("/login");

  if (!user && isClientRoute && !isPublicClientRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/client/login";
    return NextResponse.redirect(url);
  }

  if (!user && !isAdminLoginRoute && !isPublicFeedbackRoute && !isPublicClientRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (userRole === "client_portal") {
    if (!isClientRoute && !isPublicFeedbackRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return NextResponse.redirect(url);
    }

    if (isAdminLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return NextResponse.redirect(url);
    }

    return response;
  }

  if (user && userRole !== "client_portal" && isClientRoute && !isPublicClientRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && isAdminLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
};
