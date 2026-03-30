import {
  ZodCreateDiscount,
  ZodDiscount,
} from "@/src/schemas/discounts/discountSchema";

type FetchDiscountsParams = {
  phone?: string | null;
  serviceId?: string | null;
  isUsed?: boolean;
};

export const fetchDiscounts = async (
  params?: FetchDiscountsParams,
): Promise<ZodDiscount[]> => {
  const query = new URLSearchParams();

  if (params?.phone) {
    query.set("phone", params.phone);
  }

  if (params?.serviceId) {
    query.set("service_id", params.serviceId);
  }

  if (typeof params?.isUsed === "boolean") {
    query.set("is_used", String(params.isUsed));
  }

  const search = query.toString();
  const response = await fetch(
    search ? `/api/discounts?${search}` : "/api/discounts",
    {
      method: "GET",
    },
  );
  const payload = (await response.json()) as {
    data?: ZodDiscount[];
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message || "Не удалось загрузить скидки");
  }

  return payload.data ?? [];
};

export const createDiscount = async (
  payload: ZodCreateDiscount,
): Promise<ZodDiscount> => {
  const response = await fetch("/api/discounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as {
    data?: ZodDiscount;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(result.message || "Не удалось назначить скидку");
  }

  if (!result.data) {
    throw new Error("Ответ сервера не содержит данных");
  }

  return result.data;
};

export const markDiscountAsUsed = async (id: string): Promise<ZodDiscount> => {
  const response = await fetch(`/api/discounts/${id}/use`, {
    method: "PATCH",
  });
  const payload = (await response.json()) as {
    data?: ZodDiscount;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message || "Не удалось списать скидку");
  }

  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }

  return payload.data;
};
