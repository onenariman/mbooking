import { createClient } from "@/src/utils/supabase/client";
import { ZodCategory } from "../schemas/categories/categorySchema";

const supabase = createClient();

type CategoryCreateInput = Pick<ZodCategory, "category_name">;
type CategoryUpdateInput = Partial<Pick<ZodCategory, "category_name">>;

export const fetchCategory = async () => {
  const { data, error } = await supabase.from("categories").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const addCategory = async (
  category: CategoryCreateInput,
): Promise<ZodCategory> => {
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ZodCategory;
};

export const deleteCategory = async (id: string) => {
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const updateCategory = async (
  id: string,
  updates: CategoryUpdateInput,
) => {
  const { error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  return { id, updates };
};
