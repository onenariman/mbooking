import { ZodCategory } from "../schemas/categories/categorySchema";
import { nestErrorMessage, nestOwnerFetch } from "@/src/utils/api/nestOwnerApi";

type CategoryCreateInput = Pick<ZodCategory, "category_name">;
type CategoryUpdateInput = Partial<CategoryCreateInput>;

export const fetchCategory = async (): Promise<ZodCategory[]> => {
  const response = await nestOwnerFetch("categories", { method: "GET" });
  const payload = (await response.json()) as {
    data?: ZodCategory[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  return payload.data ?? [];
};

export const addCategory = async (
  category: CategoryCreateInput,
): Promise<ZodCategory> => {
  const response = await nestOwnerFetch("categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
  const payload = (await response.json()) as {
    data?: ZodCategory;
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

export const deleteCategory = async (id: string) => {
  const response = await nestOwnerFetch(`categories/${id}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as { data?: boolean; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  return payload.data ?? true;
};

export const updateCategory = async (
  id: string,
  updates: CategoryUpdateInput,
) => {
  const response = await nestOwnerFetch(`categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  const payload = (await response.json()) as {
    data?: ZodCategory;
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
