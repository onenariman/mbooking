import { nestErrorMessage, nestOwnerFetch } from "@/src/utils/api/nestOwnerApi";

export type OwnerOrganization = {
  email: string;
  full_name: string | null;
  phone: string | null;
  inn: string | null;
};

export type PatchOwnerOrganizationBody = {
  full_name?: string | null;
  phone?: string | null;
  inn?: string | null;
};

function parseMessage(payload: { message?: string | string[] } | null): string {
  if (!payload?.message) return "";
  if (typeof payload.message === "string") return payload.message;
  return payload.message.join(", ");
}

export async function fetchOwnerOrganization(): Promise<OwnerOrganization> {
  const response = await nestOwnerFetch("owner/organization", { method: "GET" });
  const payload = (await response.json().catch(() => null)) as {
    data?: OwnerOrganization;
    message?: string | string[];
  } | null;

  if (!response.ok || !payload?.data) {
    throw new Error(parseMessage(payload) || (await nestErrorMessage(response)));
  }
  return payload.data;
}

export async function patchOwnerOrganization(
  body: PatchOwnerOrganizationBody,
): Promise<OwnerOrganization> {
  const response = await nestOwnerFetch("owner/organization", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as {
    data?: OwnerOrganization;
    message?: string | string[];
  } | null;

  if (!response.ok || !payload?.data) {
    throw new Error(parseMessage(payload) || (await nestErrorMessage(response)));
  }
  return payload.data;
}

