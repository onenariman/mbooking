"use client";
import { ZodService } from "@/src/schemas/services/serviceSchema";

import { toast } from "sonner";
import { useDeleteService } from "@/src/hooks/services.hook";
import { DropdownMenuService } from "./DropdownMenuService";
import { useCategories } from "@/src/hooks/categories.hooks";
import { useState } from "react";
import { Badge } from "../ui/badge";

interface ItemProps {
  service: ZodService;
}

const ItemService = ({ service }: ItemProps) => {
  const { mutateAsync: deleteCategory } = useDeleteService();
  const { data: categories = [] } = useCategories();

  const category = categories.find(
    (category) => category.id === service.category_id,
  );

  const handleDelete = async () => {
    await deleteCategory(service.id);
    toast.success("Услуга удалена");
  };

  return (
    <div className="w-full flex items-center justify-between">
      <div className="flex flex-col gap-y-1">
        <p className="text-xs italic font-light">{category?.category_name}</p>
        <p className="text-xs font-semibold">{service.name}</p>
        <Badge variant={service.price != null ? "destructive" : "default"}>
          {service.price != null ? `${service.price} руб.` : "Цена не указана"}
        </Badge>
      </div>

      <div>
        <DropdownMenuService service={service} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default ItemService;
