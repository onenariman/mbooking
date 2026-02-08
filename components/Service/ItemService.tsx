"use client";
import { ZodService } from "@/src/schemas/services/serviceSchema";

import { toast } from "sonner";
import { useDeleteService } from "@/src/hooks/services.hook";
import { DropdownMenuService } from "./DropdownMenuService";

interface ItemProps {
  service: ZodService;
}

const ItemService = ({ service }: ItemProps) => {
  const { mutateAsync: deleteCategory } = useDeleteService();

  const handleDelete = async () => {
    await deleteCategory(service.id);
    toast.success("Услуга удалена");
  };

  return (
    <div className="w-full flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold">{service.name}</p>
        <p>{service.price != null ? `${service.price} руб.` : ""}</p>
      </div>

      <div>
        <DropdownMenuService service={service} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default ItemService;
