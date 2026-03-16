import { ZodCategory } from "../schemas/categories/categorySchema";

type CategoryCreateInput = Pick<ZodCategory, "category_name">;
type CategoryUpdateInput = Partial<Pick<ZodCategory, "category_name">>;

export const fetchCategory = async (): Promise<ZodCategory[]> => {
  const response = await fetch("/api/categories", { method: "GET" });
  const payload = (await response.json()) as {
    data?: ZodCategory[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось загрузить категории");
  }
  return payload.data ?? [];
};

export const addCategory = async (
  category: CategoryCreateInput,
): Promise<ZodCategory> => {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(category),
  });
  const payload = (await response.json()) as {
    data?: ZodCategory;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось создать категорию");
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return payload.data;
};

export const deleteCategory = async (id: string) => {
  const params = new URLSearchParams({ id });
  const response = await fetch(`/api/categories?${params.toString()}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as { data?: boolean; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось удалить категорию");
  }
  return payload.data ?? true;
};

export const updateCategory = async (
  id: string,
  updates: CategoryUpdateInput,
) => {
  const params = new URLSearchParams({ id });
  const response = await fetch(`/api/categories?${params.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const payload = (await response.json()) as {
    data?: ZodCategory;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || "Не удалось обновить категорию");
  }
  if (!payload.data) {
    throw new Error("Ответ сервера не содержит данных");
  }
  return { id, updates: payload.data };
};
