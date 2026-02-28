import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCategory,
  addCategory,
  deleteCategory,
  updateCategory,
} from "../api/categories.api";
import {
  categoryArraySchema,
  categorySchema,
  ZodCategory,
} from "../schemas/categories/categorySchema";

const CATEGORIES_QUERY_KEY = ["categories"] as const;

type CategoryCreateInput = Parameters<typeof addCategory>[0];
type CategoryUpdateInput = Parameters<typeof updateCategory>[1];

interface UpdateCategoryPayload {
  id: string;
  updates: CategoryUpdateInput;
}

export const useCategories = () => {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: async (): Promise<ZodCategory[]> => {
      const rawData = await fetchCategory();
      const result = categoryArraySchema.safeParse(rawData);

      if (!result.success) {
        console.error("Zod validation failed:", result.error.issues);
        throw new Error("Данные категорий не прошли валидацию");
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
    mutationFn: async (category: CategoryCreateInput): Promise<ZodCategory> => {
      const result = categorySchema.pick({ category_name: true }).safeParse(category);

      if (!result.success) {
        const message = result.error.issues.map((issue) => issue.message).join(", ");
        throw new Error(message);
      }

      return addCategory(result.data);
    },
    onSuccess: (newCategory) => {
      queryClient.setQueryData<ZodCategory[]>(CATEGORIES_QUERY_KEY, (oldCategory = []) => [
        newCategory,
        ...oldCategory,
      ]);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: CATEGORIES_QUERY_KEY });

      const previousCategories =
        queryClient.getQueryData<ZodCategory[]>(CATEGORIES_QUERY_KEY);

      queryClient.setQueryData<ZodCategory[]>(CATEGORIES_QUERY_KEY, (old) =>
        old?.filter((category) => category.id !== id),
      );

      return { previousCategories };
    },
    onError: (_err, _id, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData<ZodCategory[]>(
          CATEGORIES_QUERY_KEY,
          context.previousCategories,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: UpdateCategoryPayload) => updateCategory(id, updates),
    // Показываем изменения сразу, затем синхронизируем с сервером.
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: CATEGORIES_QUERY_KEY });

      const previousCategories =
        queryClient.getQueryData<ZodCategory[]>(CATEGORIES_QUERY_KEY);

      queryClient.setQueryData<ZodCategory[]>(CATEGORIES_QUERY_KEY, (old) =>
        old?.map((category) =>
          category.id === id ? { ...category, ...updates } : category,
        ),
      );

      return { previousCategories };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(CATEGORIES_QUERY_KEY, context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
};

