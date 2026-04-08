import { ZodClient } from "../schemas/clients/clientSchema";
import { nestErrorMessage, nestOwnerFetch } from "@/src/utils/api/nestOwnerApi";

type ClientCreateInput = Pick<ZodClient, "name" | "phone">;
type ClientUpdateInput = Partial<ClientCreateInput>;

export const fetchClients = async (): Promise<ZodClient[]> => {
  const response = await nestOwnerFetch("clients", { method: "GET" });
  const payload = (await response.json()) as {
    data?: ZodClient[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  return payload.data ?? [];
};

export const addClient = async (
  client: ClientCreateInput,
): Promise<ZodClient> => {
  const response = await nestOwnerFetch("clients", {
    method: "POST",
    body: JSON.stringify(client),
  });
  const payload = (await response.json()) as {
    data?: ZodClient;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return payload.data;
};

export const deleteClient = async (id: string) => {
  const response = await nestOwnerFetch(`clients/${id}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as {
    data?: boolean;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  return payload.data ?? true;
};

export const updateClient = async (id: string, updates: ClientUpdateInput) => {
  const response = await nestOwnerFetch(`clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  const payload = (await response.json()) as {
    data?: ZodClient;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return { id, updates: payload.data };
};
