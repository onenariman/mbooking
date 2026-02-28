"use client";

import { toast } from "sonner";
import { useCategories } from "@/src/hooks/categories.hooks";
import { useDeleteService } from "@/src/hooks/services.hook";
import { ZodService } from "@/src/schemas/services/serviceSchema";
import { Badge } from "../ui/badge";
import { DropdownMenuService } from "./DropdownMenuService";

interface ItemProps {
  service: ZodService;
}

const ItemService = ({ service }: ItemProps) => {
  const { mutateAsync: deleteService } = useDeleteService();
  const { data: categories = [] } = useCategories();

  const category = categories.find((item) => item.id === service.category_id);

  const handleDelete = async () => {
    await deleteService(service.id);
    toast.success("Услуга удалена");
  };

  return (
    <div className="flex w-full items-center justify-between text-foreground p-2">
      <div className="flex flex-col gap-y-1">
        <p className="text-xs font-light italic">{category?.category_name}</p>
        <p className="text-xs font-semibold">{service.name}</p>
        <Badge variant={service.price != null ? "destructive" : "default"}>
          {service.price != null
            ? `${service.price.toLocaleString("ru-RU")} руб.`
            : "Цена не указана"}
        </Badge>
      </div>

      <DropdownMenuService service={service} onDelete={handleDelete} />
    </div>
  );
};

export default ItemService;
