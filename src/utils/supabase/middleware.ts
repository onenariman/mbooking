import { type NextRequest, NextResponse } from "next/server";
import { getNestAccessFromRequest } from "@/src/lib/owner-session";

/**
 * Доступ мастера и клиентского кабинета — только по Nest JWT в httpOnly cookie.
 * Supabase не используется.
 */
export const updateSession = async (request: NextRequest) => {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isPublicFeedbackRoute = pathname.startsWith("/feedback/");
  const isClientRoute = pathname === "/client" || pathname.startsWith("/client/");
  const isPublicClientRoute =
    pathname.startsWith("/client/login") || pathname.startsWith("/client/invite/");
  const isOwnerAuthPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const session = await getNestAccessFromRequest(request);
  const ownerAuthed = session?.role === "owner";
  const clientAuthed = session?.role === "client_portal";

  if (isClientRoute && !isPublicClientRoute && !clientAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/client/login";
    return NextResponse.redirect(url);
  }

  if (
    !isClientRoute &&
    !isPublicFeedbackRoute &&
    !isPublicClientRoute &&
    !isOwnerAuthPublicRoute &&
    !ownerAuthed
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (clientAuthed) {
    if (!isClientRoute && !isPublicFeedbackRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return NextResponse.redirect(url);
    }

    if (isOwnerAuthPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return NextResponse.redirect(url);
    }

    return response;
  }

  if (ownerAuthed && !clientAuthed && isClientRoute && !isPublicClientRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (
    ownerAuthed &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/receptions";
    return NextResponse.redirect(url);
  }

  return response;
};
