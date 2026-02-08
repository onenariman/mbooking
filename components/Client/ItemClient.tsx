"use client";
import { ZodClient } from "@/src/schemas/clients/clientSchema";
import { useDeleteClient } from "@/src/hooks/clients.hooks";

import { toast } from "sonner";
import { DropdownMenuClient } from "./DropdownMenuClient";
import ClientContactActions from "./ClientContactActions";

interface ItemProps {
  client: ZodClient;
}

const ItemClient = ({ client }: ItemProps) => {
  const { mutateAsync: deleteClient } = useDeleteClient();

  const handleDelete = async () => {
    await deleteClient(client.id);
    toast.success("Клиент удалён");
  };

  return (
    <div className="w-full flex items-center justify-between">
      <div className="flex flex-col items-start gap-y-2">
        <p className="text-md font-semibold">{client.name}</p>
        <ClientContactActions client={client} />
      </div>
      <div>
        <DropdownMenuClient client={client} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default ItemClient;
