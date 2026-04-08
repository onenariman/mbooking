import type { Category } from "@prisma/client";

export type CategoryResponse = {
  id: string;
  created_at: string;
  category_name: string;
  user_id: string;
};

export function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    created_at: category.createdAt.toISOString(),
    category_name: category.categoryName,
    user_id: category.userId,
  };
}
