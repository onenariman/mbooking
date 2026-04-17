import { AppointmentArraySchema } from "@/src/schemas/books/bookSchema";
import { discountArraySchema } from "@/src/schemas/discounts/discountSchema";
import { getNestServerBaseUrl } from "@/src/server/nest-internal";
import { resolveSessionFromCookies } from "@/src/server/nest-session";
import { type SessionTokens } from "@/src/server/owner-session-cookies";
import { normalizePhone } from "@/src/validators/normalizePhone";

export type ClientPortalProfile = {
  auth_user_id: string;
  phone: string;
  email: string | null;
  display_name: string | null;
  notifications_enabled: boolean;
  client_reminder_offsets_minutes: number[];
  quiet_hours_start_utc: string | null;
  quiet_hours_end_utc: string | null;
  created_at?: string;
  last_login_at?: string | null;
};

export type ClientPortalLink = {
  id: string;
  owner_user_id: string;
  client_auth_user_id: string;
  client_id: string | null;
  client_phone: string;
  is_active: boolean;
};

export type ClientPortalContext = {
  authUserId: string;
  profile: ClientPortalProfile;
  links: ClientPortalLink[];
  activeLink: ClientPortalLink;
  clientPhone: string;
  ownerUserId: string;
  clientId: string | null;
  accessToken: string;
  sessionUpdate?: SessionTokens;
};

type ClientPortalSession = {
  accessToken: string;
  sessionUpdate?: SessionTokens;
};

async function getClientPortalSession(): Promise<ClientPortalSession | null> {
  const session = await resolveSessionFromCookies("client_portal");
  if (!session.accessToken) {
    return null;
  }
  return {
    accessToken: session.accessToken,
    sessionUpdate: session.sessionUpdate,
  };
}

async function nestAuthedFetch(
  path: string,
  session: ClientPortalSession,
): Promise<Response | null> {
  const base = getNestServerBaseUrl();
  if (!base) {
    return null;
  }
  return fetch(`${base}/v1/${path}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
}

export async function getClientPortalContextFromSession(): Promise<ClientPortalContext | null> {
  const session = await getClientPortalSession();
  if (!session) {
    return null;
  }

  const authRes = await nestAuthedFetch("auth/me", session);
  if (!authRes?.ok) {
    return null;
  }
  const authUser = (await authRes.json()) as {
    id?: string;
    role?: string;
  };
  if (authUser.role !== "client_portal" || !authUser.id) {
    return null;
  }

  const meRes = await nestAuthedFetch("client/me", session);
  if (!meRes?.ok) {
    return null;
  }
  const meJson = (await meRes.json()) as {
    data?: {
      auth_user_id: string;
      phone: string;
      email: string | null;
      display_name: string | null;
      notifications_enabled: boolean;
      client_reminder_offsets_minutes: number[];
      quiet_hours_start_utc: string | null;
      quiet_hours_end_utc: string | null;
      active_owner_user_id: string;
      linked_businesses_count: number;
    };
  };
  const data = meJson.data;
  if (!data) {
    return null;
  }

  const clientPhone = normalizePhone(data.phone) || data.phone;

  const profile: ClientPortalProfile = {
    auth_user_id: data.auth_user_id,
    phone: data.phone,
    email: data.email ?? null,
    display_name: data.display_name,
    notifications_enabled: data.notifications_enabled,
    client_reminder_offsets_minutes: data.client_reminder_offsets_minutes ?? [],
    quiet_hours_start_utc: data.quiet_hours_start_utc ?? null,
    quiet_hours_end_utc: data.quiet_hours_end_utc ?? null,
  };

  const activeLink: ClientPortalLink = {
    id: "nest-active",
    owner_user_id: data.active_owner_user_id,
    client_auth_user_id: data.auth_user_id,
    client_id: null,
    client_phone: clientPhone,
    is_active: true,
  };

  return {
    authUserId: data.auth_user_id,
    profile,
    links: [activeLink],
    activeLink,
    clientPhone,
    ownerUserId: data.active_owner_user_id,
    clientId: null,
    accessToken: session.accessToken,
    sessionUpdate: session.sessionUpdate,
  };
}

export async function getClientPortalAppointments(context: ClientPortalContext) {
  const res = await nestAuthedFetch("client/appointments", context);
  if (!res?.ok) {
    throw new Error("Не удалось загрузить записи");
  }
  const json = (await res.json()) as {
    data?: { upcoming: unknown[]; history: unknown[] };
  };
  const upcomingRaw = json.data?.upcoming ?? [];
  const historyRaw = json.data?.history ?? [];

  const upcomingParsed = AppointmentArraySchema.safeParse(upcomingRaw);
  const historyParsed = AppointmentArraySchema.safeParse(historyRaw);
  if (!upcomingParsed.success || !historyParsed.success) {
    throw new Error("Данные записей клиента не прошли валидацию");
  }

  return {
    upcoming: upcomingParsed.data,
    history: historyParsed.data,
  };
}

export async function getClientPortalDiscounts(context: ClientPortalContext) {
  const res = await nestAuthedFetch("client/discounts", context);
  if (!res?.ok) {
    throw new Error("Не удалось загрузить скидки");
  }
  const json = (await res.json()) as {
    data?: { active: unknown[]; archive: unknown[] };
  };
  const activeRaw = json.data?.active ?? [];
  const archiveRaw = json.data?.archive ?? [];

  const activeParsed = discountArraySchema.safeParse(activeRaw);
  const archiveParsed = discountArraySchema.safeParse(archiveRaw);
  if (!activeParsed.success || !archiveParsed.success) {
    throw new Error("Данные скидок клиента не прошли валидацию");
  }

  return {
    active: activeParsed.data,
    archive: archiveParsed.data,
  };
}

export async function getClientPortalMe(context: ClientPortalContext) {
  return {
    auth_user_id: context.authUserId,
    phone: context.clientPhone,
    email: context.profile.email,
    display_name: context.profile.display_name,
    notifications_enabled: context.profile.notifications_enabled,
    client_reminder_offsets_minutes: context.profile.client_reminder_offsets_minutes,
    quiet_hours_start_utc: context.profile.quiet_hours_start_utc,
    quiet_hours_end_utc: context.profile.quiet_hours_end_utc,
    active_owner_user_id: context.ownerUserId,
    linked_businesses_count: context.links.length,
  };
}

/** Nest обновляет last_seen при GET /v1/client/me; здесь дублируем вызовом me. */
export async function touchClientPortalSession(_context: ClientPortalContext) {
  await nestAuthedFetch("client/me", _context);
}
