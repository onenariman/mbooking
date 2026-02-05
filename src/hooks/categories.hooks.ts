import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchCategory,
  addCategory,
  deleteCategory,
  updateCategory,
} from "../api/categories.api";

import {
  categoryArraySchema,
  ZodCategory,
  categorySchema,
} from "../schemas/categories/categorySchema";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<ZodCategory[]> => {
      const rawData = await fetchCategory();

      const result = categoryArraySchema.safeParse(rawData);

      if (!result.success) {
        console.error("Zod validation failed:", result.error.issues);
        throw new Error("Данные не прошли валидацию");
      }

      return result.data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};

export const useAddCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      category: Partial<ZodCategory>,
    ): Promise<ZodCategory> => {
      const result = categorySchema
        .partial()
        .pick({ category_name: true })
        .safeParse(category);

      if (!result.success) {
        const msg = result.error.issues.map((i) => i.message).join(", ");
        throw new Error(msg);
      }

      return addCategory(category);
    },
    onSuccess: (newCategory) => {
      queryClient.setQueryData<ZodCategory[]>(
        ["categories"],
        (oldCategory = []) => {
          return [newCategory, ...oldCategory];
        },
      );
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),

    // Оптимистичное удаление
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });

      const previousCategories = queryClient.getQueryData<ZodCategory[]>([
        "categories",
      ]);

      queryClient.setQueryData<ZodCategory[]>(["categories"], (old) =>
        old?.filter((c) => c.id !== id),
      );

      return { previousCategories };
    },

    // Rollback, если ошибка
    onError: (_err, _id, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData<ZodCategory[]>(
          ["categories"],
          context.previousCategories,
        );
      }
    },

    // Синхронизация с сервером
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ZodCategory>;
    }) => updateCategory(id, updates),

    // 🔥 OPTIMISTIC UPDATE
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: ["categories"],
      });

      const previousCategories = queryClient.getQueryData<ZodCategory[]>([
        "categories",
      ]);

      queryClient.setQueryData<ZodCategory[]>(["categories"], (old) =>
        old?.map((category) =>
          category.id === id ? { ...category, ...updates } : category,
        ),
      );

      return { previousCategories };
    },

    // 🔁 ROLLBACK
    onError: (_err, _vars, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
    },

    // 🔄 SYNC WITH SERVER
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
    },
  });
};
