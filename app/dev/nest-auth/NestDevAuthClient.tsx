"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ownerLogout,
  refreshOwnerSessionFromCookies,
  setOwnerSessionFromNestTokens,
} from "@/app/actions/owner-auth.actions";
import { clearNestTokens } from "@/src/utils/api/nestOwnerApi";

export function NestDevAuthClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const publicNest = process.env.NEXT_PUBLIC_NEST_API_URL?.trim();
  if (!publicNest) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <p>
          Эта страница бьёт в Nest с браузера — нужен{" "}
          <code>NEXT_PUBLIC_NEST_API_URL</code> (например{" "}
          <code>http://localhost:4000</code>). Для обычного входа используйте{" "}
          <code>/login</code> с <code>NEST_API_INTERNAL_URL</code> на сервере Next.
        </p>
      </div>
    );
  }

  const base = publicNest.replace(/\/$/, "");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`${base}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
        message?: string;
      };
      if (!res.ok || !json.accessToken || !json.refreshToken) {
        setStatus(json.message || res.statusText || "Ошибка входа");
        return;
      }
      clearNestTokens();
      await setOwnerSessionFromNestTokens(json.accessToken, json.refreshToken);
      setStatus("Сессия записана в httpOnly cookie. Можно открыть раздел клиентов.");
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Сеть недоступна");
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    clearNestTokens();
    await ownerLogout();
    setStatus("Сессия и cookie очищены.");
    router.refresh();
  };

  const onRefresh = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const r = await refreshOwnerSessionFromCookies();
      if (!r.ok) {
        setStatus(r.message || "Refresh не удался");
        return;
      }
      setStatus("Пара токенов в cookie обновлена.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 420, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 18 }}>Nest — dev-логин</h1>
      <p style={{ color: "#555", fontSize: 14 }}>
        Локальная проверка против <code>{base}</code>; сессия как на{" "}
        <code>/login</code> (cookie + прокси <code>/api/nest-v1</code>).
      </p>
      <form onSubmit={onLogin} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 4 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            minLength={8}
          />
        </label>
        <button type="submit" disabled={busy}>
          Войти и записать cookie
        </button>
      </form>
      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => void onRefresh()} disabled={busy}>
          Обновить access (refresh из cookie)
        </button>
        <button type="button" onClick={() => void onLogout()} disabled={busy}>
          Выйти (cookie + localStorage)
        </button>
      </div>
      {status ? (
        <p style={{ marginTop: 16, fontSize: 14 }} role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
