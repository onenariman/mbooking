import { ZodClient } from "../schemas/clients/clientSchema";

type ClientCreateInput = Pick<ZodClient, "name" | "phone">;
type ClientUpdateInput = Partial<ClientCreateInput>;

export const fetchClients = async (): Promise<ZodClient[]> => {
  const response = await fetch("/api/clients", { method: "GET" });
  const payload = (await response.json()) as { data?: ZodClient[]; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось загрузить клиентов");
  }
  return payload.data ?? [];
};

export const addClient = async (
  client: ClientCreateInput,
): Promise<ZodClient> => {
  const response = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(client),
  });
  const payload = (await response.json()) as { data?: ZodClient; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось создать клиента");
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return payload.data;
};

export const deleteClient = async (id: string) => {
  const params = new URLSearchParams({ id });
  const response = await fetch(`/api/clients?${params.toString()}`, { method: "DELETE" });
  const payload = (await response.json()) as { data?: boolean; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось удалить клиента");
  }
  return payload.data ?? true;
};

export const updateClient = async (id: string, updates: ClientUpdateInput) => {
  const params = new URLSearchParams({ id });
  const response = await fetch(`/api/clients?${params.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const payload = (await response.json()) as { data?: ZodClient; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось обновить клиента");
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return { id, updates: payload.data };
};

