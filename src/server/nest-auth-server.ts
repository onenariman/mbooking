import { getNestServerBaseUrl } from "@/src/server/nest-internal";

type NestTokenResponse = {
  accessToken?: string;
  refreshToken?: string;
};

function flattenMessage(message: unknown): string {
  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    return message
      .flatMap((m) => (Array.isArray(m) ? m : [m]))
      .map(String)
      .join(", ");
  }
  return "";
}

export async function postNestAuth(
  path: "/v1/auth/login" | "/v1/auth/register",
  body: { email: string; password: string },
): Promise<
  | { ok: true; accessToken: string; refreshToken: string }
  | { ok: false; status: number; message: string }
> {
  const base = getNestServerBaseUrl();
  if (!base) {
    return { ok: false, status: 503, message: "Nest не настроен (нет URL)" };
  }
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as NestTokenResponse & {
    message?: unknown;
  };
  if (!res.ok) {
    const msg =
      flattenMessage(json.message) || res.statusText || "Ошибка авторизации";
    return { ok: false, status: res.status, message: msg };
  }
  if (!json.accessToken || !json.refreshToken) {
    return { ok: false, status: 502, message: "Неверный ответ сервера" };
  }
  return {
    ok: true,
    accessToken: json.accessToken,
    refreshToken: json.refreshToken,
  };
}
