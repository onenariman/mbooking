"use client";
import { toast } from "sonner";
import { ZodCategory } from "@/src/schemas/categories/categorySchema";
import DeleteCategory from "./DeleteCategory";
import EditCategory from "./EditCategory";
import { useDeleteCategory } from "@/src/hooks/categories.hooks";

interface ItemProps {
  category: ZodCategory;
}

const ItemCategory = ({ category }: ItemProps) => {
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const handleDelete = async () => {
    await deleteCategory(category.id);
    toast.success("Категория удалена");
  };

  return (
    <div className="w-full flex items-center justify-between">
      <p className="text-xs font-semibold">{category.category_name}</p>

      <div className="flex items-center gap-x-2">
        <EditCategory category={category} />
        <DeleteCategory onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default ItemCategory;
