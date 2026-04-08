import { createHash, randomBytes } from "node:crypto";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
import { supabaseAdmin } from "@/src/utils/supabase/admin";
import {
  formatPhoneDisplay,
  normalizePhone,
} from "@/src/validators/normalizePhone";

export class ClientPortalInviteError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ClientPortalInviteError";
    this.status = status;
  }
}

const inviteSelect =
  "id, owner_user_id, client_phone, purpose, expires_at, used_at, created_at, created_by";

type InviteRow = {
  id: string;
  owner_user_id: string;
  client_phone: string;
  purpose: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  created_by: string;
};

type ClientRow = {
  id: string;
  name: string;
  phone: string;
  user_id: string;
};

const buildInviteToken = () => randomBytes(32).toString("hex");

export const hashClientPortalInviteToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const getInviteClient = async (params: {
  ownerUserId: string;
  clientId?: string;
  clientPhone?: string;
}) => {
  if (!params.clientId && !params.clientPhone) {
    throw new ClientPortalInviteError("Не указан клиент для приглашения", 400);
  }

  if (params.clientId) {
    const { data, error } = await supabaseAdmin
      .from("clients")
      .select("id, name, phone, user_id")
      .eq("user_id", params.ownerUserId)
      .eq("id", params.clientId)
      .maybeSingle();

    if (error) {
      throw new ClientPortalInviteError(mapSupabaseError(error), 500);
    }

    if (data) {
      return data as ClientRow;
    }
  }

  if (params.clientPhone) {
    const phoneTail = params.clientPhone.slice(-10);
    const { data, error } = await supabaseAdmin
      .from("clients")
      .select("id, name, phone, user_id")
      .eq("user_id", params.ownerUserId)
      .ilike("phone", `%${phoneTail}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw new ClientPortalInviteError(mapSupabaseError(error), 500);
    }

    const candidates = ((data as ClientRow[] | null) ?? []).filter(
      (client) => normalizePhone(client.phone) === params.clientPhone,
    );

    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  return null;
};

const getClientById = async (clientId: string) => {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("id, name, phone, user_id")
    .eq("id", clientId)
    .maybeSingle();

  if (error) {
    throw new ClientPortalInviteError(mapSupabaseError(error), 500);
  }

  return (data as ClientRow | null) ?? null;
};

export async function createClientPortalInvite(params: {
  ownerUserId: string;
  createdBy: string;
  clientId?: string;
  clientPhone: string;
  purpose: "activation" | "password_reset";
  expiresInHours: number;
  appBaseUrl: string;
}) {
  const normalizedPhone = normalizePhone(params.clientPhone);

  if (!normalizedPhone) {
    throw new ClientPortalInviteError("Телефон клиента некорректный", 400);
  }

  const client = await getInviteClient({
    ownerUserId: params.ownerUserId,
    clientId: params.clientId,
    clientPhone: normalizedPhone,
  });

  if (!client && params.clientId) {
    const foreignClient = await getClientById(params.clientId);

    if (foreignClient) {
      throw new ClientPortalInviteError(
        "Этот клиент найден, но не принадлежит текущей сессии. Скорее всего, сейчас открыт клиентский кабинет или другой аккаунт.",
        403,
      );
    }
  }

  const normalizedClientPhone = normalizePhone(client?.phone ?? normalizedPhone);

  if (!normalizedClientPhone) {
    throw new ClientPortalInviteError(
      "У клиента сохранен некорректный номер телефона",
      400,
    );
  }

  const token = buildInviteToken();
  const tokenHash = hashClientPortalInviteToken(token);
  const expiresAt = new Date(
    Date.now() + params.expiresInHours * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabaseAdmin.from("client_portal_invites").insert({
    owner_user_id: params.ownerUserId,
    client_phone: normalizedClientPhone,
    token_hash: tokenHash,
    purpose: params.purpose,
    expires_at: expiresAt,
    created_by: params.createdBy,
  });

  if (error) {
    throw new ClientPortalInviteError(mapSupabaseError(error), 500);
  }

  const baseUrl = params.appBaseUrl.replace(/\/$/, "");

  return {
    invitation_link: `${baseUrl}/client/invite/${token}`,
    client_phone: normalizedClientPhone,
    client_phone_display: formatPhoneDisplay(normalizedClientPhone),
    client_name: client?.name ?? null,
    purpose: params.purpose,
    expires_at: expiresAt,
  };
}

export async function validateClientPortalInvite(token: string) {
  if (!token || token.length < 16) {
    throw new ClientPortalInviteError("Приглашение недействительно", 404);
  }

  const tokenHash = hashClientPortalInviteToken(token);
  const { data, error } = await supabaseAdmin
    .from("client_portal_invites")
    .select(inviteSelect)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new ClientPortalInviteError(mapSupabaseError(error), 500);
  }

  const invite = data as InviteRow | null;

  if (!invite) {
    throw new ClientPortalInviteError("Приглашение не найдено", 404);
  }

  if (invite.used_at) {
    throw new ClientPortalInviteError("Приглашение уже использовано", 410);
  }

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    throw new ClientPortalInviteError("Срок действия приглашения истек", 410);
  }

  const client = await getInviteClient({
    ownerUserId: invite.owner_user_id,
    clientPhone: invite.client_phone,
  });

  return {
    invite,
    client_name: client?.name ?? null,
    client_phone_display: formatPhoneDisplay(invite.client_phone),
  };
}

export async function activateClientPortalInvite(params: {
  token: string;
  email: string;
  password: string;
}) {
  const { invite, client_name: clientName } = await validateClientPortalInvite(
    params.token,
  );

  const { data: existingProfile, error: profileError } = await supabaseAdmin
    .from("client_portal_profiles")
    .select("auth_user_id, phone, display_name")
    .eq("phone", invite.client_phone)
    .maybeSingle();

  if (profileError) {
    throw new ClientPortalInviteError(mapSupabaseError(profileError), 500);
  }

  const now = new Date().toISOString();
  let authUserId = existingProfile?.auth_user_id ?? null;

  if (authUserId) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        role: "client_portal",
      },
    });

    if (error) {
      throw new ClientPortalInviteError(error.message, 500);
    }
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        role: "client_portal",
      },
    });

    if (error || !data.user) {
      throw new ClientPortalInviteError(
        error?.message ?? "Не удалось создать кабинет",
        500,
      );
    }

    authUserId = data.user.id;
  }

  const client = await getInviteClient({
    ownerUserId: invite.owner_user_id,
    clientPhone: invite.client_phone,
  });
  const displayName = existingProfile?.display_name ?? clientName ?? null;

  const { error: upsertProfileError } = await supabaseAdmin
    .from("client_portal_profiles")
    .upsert(
      {
        auth_user_id: authUserId,
        phone: invite.client_phone,
        display_name: displayName,
        last_login_at: now,
      },
      { onConflict: "auth_user_id" },
    );

  if (upsertProfileError) {
    throw new ClientPortalInviteError(mapSupabaseError(upsertProfileError), 500);
  }

  const { error: upsertLinkError } = await supabaseAdmin
    .from("client_portal_links")
    .upsert(
      {
        owner_user_id: invite.owner_user_id,
        client_auth_user_id: authUserId,
        client_id: client?.id ?? null,
        client_phone: invite.client_phone,
        is_active: true,
        last_seen_at: now,
      },
      { onConflict: "owner_user_id,client_phone" },
    );

  if (upsertLinkError) {
    throw new ClientPortalInviteError(mapSupabaseError(upsertLinkError), 500);
  }

  const { error: usedInviteError } = await supabaseAdmin
    .from("client_portal_invites")
    .update({ used_at: now })
    .eq("id", invite.id);

  if (usedInviteError) {
    throw new ClientPortalInviteError(mapSupabaseError(usedInviteError), 500);
  }

  return {
    client_phone: invite.client_phone,
    client_phone_display: formatPhoneDisplay(invite.client_phone),
    client_name: displayName,
    owner_user_id: invite.owner_user_id,
    purpose: invite.purpose,
  };
}
