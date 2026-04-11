import { type NextRequest, NextResponse } from "next/server";
import {
  applySessionTokensToRequestHeaders,
  clearSessionCookiesInRequestHeaders,
  resolveSessionFromRequest,
} from "@/src/server/nest-session-shared";
import {
  applySessionCookiesToResponse,
  clearSessionCookiesOnResponse,
} from "@/src/server/owner-session-cookies";

/**
 * Две независимые сессии: cookie мастера и cookie клиентского кабинета.
 */
export const updateSession = async (request: NextRequest) => {
  const requestHeaders = new Headers(request.headers);

  const pathname = request.nextUrl.pathname;
  const isPublicFeedbackRoute = pathname.startsWith("/feedback/");
  const isClientRoute = pathname === "/client" || pathname.startsWith("/client/");
  const isPublicClientRoute =
    pathname.startsWith("/client/login") || pathname.startsWith("/client/invite/");
  const isOwnerAuthPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const ownerSession = await resolveSessionFromRequest(request, "owner");
  if (ownerSession.sessionUpdate) {
    applySessionTokensToRequestHeaders(
      requestHeaders,
      "owner",
      ownerSession.sessionUpdate,
    );
  } else if (ownerSession.clearCookies) {
    clearSessionCookiesInRequestHeaders(requestHeaders, "owner");
  }

  const clientSession = await resolveSessionFromRequest(request, "client_portal");
  if (clientSession.sessionUpdate) {
    applySessionTokensToRequestHeaders(
      requestHeaders,
      "client_portal",
      clientSession.sessionUpdate,
    );
  } else if (clientSession.clearCookies) {
    clearSessionCookiesInRequestHeaders(requestHeaders, "client_portal");
  }

  const ownerAuthed = ownerSession.payload?.role === "owner";
  const clientAuthed = clientSession.payload?.role === "client_portal";

  const makeRedirectUrl = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    return url;
  };

  const finalizeResponse = (response: NextResponse) => {
    if (ownerSession.sessionUpdate) {
      applySessionCookiesToResponse(response, "owner", ownerSession.sessionUpdate);
    } else if (ownerSession.clearCookies) {
      clearSessionCookiesOnResponse(response, "owner");
    }

    if (clientSession.sessionUpdate) {
      applySessionCookiesToResponse(
        response,
        "client_portal",
        clientSession.sessionUpdate,
      );
    } else if (clientSession.clearCookies) {
      clearSessionCookiesOnResponse(response, "client_portal");
    }

    return response;
  };

  if (isClientRoute && !isPublicClientRoute && !clientAuthed) {
    return finalizeResponse(NextResponse.redirect(makeRedirectUrl("/client/login")));
  }

  if (
    !isClientRoute &&
    !isPublicFeedbackRoute &&
    !isPublicClientRoute &&
    !isOwnerAuthPublicRoute
  ) {
    if (clientAuthed && !ownerAuthed) {
      return finalizeResponse(NextResponse.redirect(makeRedirectUrl("/client")));
    }
    if (!ownerAuthed) {
      return finalizeResponse(NextResponse.redirect(makeRedirectUrl("/")));
    }
  }

  if (clientAuthed && !ownerAuthed && isOwnerAuthPublicRoute) {
    return finalizeResponse(NextResponse.redirect(makeRedirectUrl("/client")));
  }

  if (ownerAuthed && !clientAuthed && isClientRoute && !isPublicClientRoute) {
    return finalizeResponse(NextResponse.redirect(makeRedirectUrl("/")));
  }

  if (
    ownerAuthed &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return finalizeResponse(NextResponse.redirect(makeRedirectUrl("/receptions")));
  }

  return finalizeResponse(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
  );
};
