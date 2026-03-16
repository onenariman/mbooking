import { ZodService } from "../schemas/services/serviceSchema";

type ServiceCreateInput = Pick<ZodService, "name" | "category_id" | "price">;
type ServiceUpdateInput = Partial<
  Pick<ZodService, "name" | "category_id" | "price">
>;

export const fetchServices = async (): Promise<ZodService[]> => {
  const response = await fetch("/api/services", { method: "GET" });
  const payload = (await response.json()) as { data?: ZodService[]; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось загрузить услуги");
  }
  return payload.data ?? [];
};

export const addService = async (
  service: ServiceCreateInput,
): Promise<ZodService> => {
  const response = await fetch("/api/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(service),
  });
  const payload = (await response.json()) as { data?: ZodService; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось создать услугу");
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return payload.data;
};

export const deleteService = async (id: string) => {
  const params = new URLSearchParams({ id });
  const response = await fetch(`/api/services?${params.toString()}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as { data?: boolean; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось удалить услугу");
  }
  return payload.data ?? true;
};

export const updateService = async (
  id: string,
  updates: ServiceUpdateInput,
) => {
  const params = new URLSearchParams({ id });
  const response = await fetch(`/api/services?${params.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const payload = (await response.json()) as { data?: ZodService; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось обновить услугу");
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return { id, updates: payload.data };
};
