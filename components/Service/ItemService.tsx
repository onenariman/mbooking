"use client";
import { ZodService } from "@/src/schemas/services/serviceSchema";

import { toast } from "sonner";
import EditService from "./EditService";
import DeleteService from "./DeleteService";
import { useDeleteService } from "@/src/hooks/services.hook";

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

      <div className="flex items-center gap-x-2">
        <EditService service={service} />
        <DeleteService onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default ItemService;
