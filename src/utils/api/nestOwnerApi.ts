const ACCESS_KEY = "mbooking_nest_access_token";
const REFRESH_KEY = "mbooking_nest_refresh_token";

/**
 * Данные через Nest BFF. Отключить: NEXT_PUBLIC_USE_NEST_BFF=0
 */
export function isNestBackendConfigured(): boolean {
  const v = process.env.NEXT_PUBLIC_USE_NEST_BFF;
  if (v === "0" || v === "false") {
    return false;
  }
  return true;
}

/** Публичные эндпоинты Nest (без cookie), с браузера — нужен CORS на Nest. */
export function getPublicNestBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_NEST_API_URL?.trim();
  if (u) {
    return u.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:4000";
  }
  throw new Error("NEXT_PUBLIC_NEST_API_URL не задан");
}

/** Для страницы /dev/nest-auth — прямой вызов Nest с клиента. */
export function getNestBaseUrl(): string {
  return getPublicNestBaseUrl();
}

export async function nestPublicV1Fetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = getPublicNestBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${base}/v1${normalized}`, {
    ...init,
    headers,
    mode: "cors",
  });
}

export function setNestTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearNestTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getNestAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getNestRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

/**
 * Авторизованные запросы к Nest: same-origin `/api/nest-v1` + httpOnly JWT.
 */
export async function nestOwnerFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  if (!isNestBackendConfigured()) {
    throw new Error("Nest BFF отключён (NEXT_PUBLIC_USE_NEST_BFF)");
  }
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  const url = `/api/nest-v1/${normalized}`;
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers, credentials: "include" });
}

export async function nestErrorMessage(res: Response): Promise<string> {
  let body: unknown;
  try {
    body = await res.clone().json();
  } catch {
    return res.statusText || "Ошибка запроса";
  }
  if (body && typeof body === "object") {
    const o = body as {
      message?: string | string[];
      error?: string;
    };
    if (typeof o.message === "string") return o.message;
    if (Array.isArray(o.message)) {
      const flat = o.message.flatMap((m) =>
        Array.isArray(m) ? m : [String(m)],
      );
      return flat.join(", ");
    }
    if (typeof o.error === "string") return o.error;
  }
  return res.statusText || "Ошибка запроса";
}
