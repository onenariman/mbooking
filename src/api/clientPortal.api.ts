import {
  nestClientPortalFetch,
  nestErrorMessage,
  nestPublicV1Fetch,
} from "@/src/utils/api/nestOwnerApi";

export type ClientPortalMe = {
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

export type PatchClientPortalSettingsBody = {
  email?: string;
  notifications_enabled?: boolean;
  client_reminder_offsets_minutes?: number[];
  quiet_hours_start_utc?: string | null;
  quiet_hours_end_utc?: string | null;
};

export type ClientInviteValidatePayload = {
  client_phone: string;
  client_phone_display: string;
  client_name: string | null;
  purpose: string;
  expires_at: string;
};

function parseMessage(payload: { message?: string | string[] } | null): string {
  if (!payload?.message) {
    return "";
  }
  if (typeof payload.message === "string") {
    return payload.message;
  }
  return payload.message.join(", ");
}

export async function fetchClientPortalMe(): Promise<ClientPortalMe> {
  const response = await nestClientPortalFetch("client/me", { method: "GET" });
  const payload = (await response.json().catch(() => null)) as {
    data?: ClientPortalMe;
    message?: string | string[];
  } | null;

  if (!response.ok || !payload?.data) {
    throw new Error(
      parseMessage(payload) || (await nestErrorMessage(response)),
    );
  }
  return payload.data;
}

export async function patchClientPortalSettings(
  body: PatchClientPortalSettingsBody,
): Promise<void> {
  const response = await nestClientPortalFetch("client/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;

  if (!response.ok) {
    throw new Error(
      parseMessage(payload) || (await nestErrorMessage(response)),
    );
  }
}

export async function fetchValidateClientInvite(
  token: string,
): Promise<ClientInviteValidatePayload> {
  const response = await nestPublicV1Fetch(
    `client/invitations/${encodeURIComponent(token)}/validate`,
    { method: "GET", cache: "no-store" },
  );
  const payload = (await response.json().catch(() => null)) as {
    data?: ClientInviteValidatePayload;
    message?: string | string[];
  } | null;

  if (!response.ok || !payload?.data) {
    throw new Error(
      parseMessage(payload) || (await nestErrorMessage(response)),
    );
  }
  return payload.data;
}
