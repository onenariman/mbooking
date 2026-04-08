import { ZodService } from "../schemas/services/serviceSchema";
import { nestErrorMessage, nestOwnerFetch } from "@/src/utils/api/nestOwnerApi";

type ServiceCreateInput = Pick<
  ZodService,
  "name" | "category_id" | "price"
>;
type ServiceUpdateInput = Partial<ServiceCreateInput>;

export const fetchServices = async (): Promise<ZodService[]> => {
  const response = await nestOwnerFetch("services", { method: "GET" });
  const payload = (await response.json()) as {
    data?: ZodService[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  return payload.data ?? [];
};

export const addService = async (
  service: ServiceCreateInput,
): Promise<ZodService> => {
  const response = await nestOwnerFetch("services", {
    method: "POST",
    body: JSON.stringify(service),
  });
  const payload = (await response.json()) as {
    data?: ZodService;
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

export const deleteService = async (id: string) => {
  const response = await nestOwnerFetch(`services/${id}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as { data?: boolean; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  return payload.data ?? true;
};

export const updateService = async (id: string, updates: ServiceUpdateInput) => {
  const response = await nestOwnerFetch(`services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  const payload = (await response.json()) as {
    data?: ZodService;
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
