"use client";
import Link from "next/link";
import { ZodClient } from "@/src/schemas/clients/clientSchema";
import { useDeleteClient } from "@/src/hooks/clients.hooks";

import { MessageCircle, PhoneCall } from "lucide-react";
import { Button } from "../ui/button";
import { EditClient } from "./EditClient";
import { DeleteClient } from "./DeleteClient";
import { toast } from "sonner";

interface ItemProps {
  client: ZodClient;
}

const Item = ({ client }: ItemProps) => {
  const { mutateAsync: deleteClient } = useDeleteClient();

  const handleDelete = async () => {
    await deleteClient(client.id);
    toast.success("Клиент удалён");
  };

  return (
    <div className="w-full">
      <div className="flex flex-col w-full">
        <p className="text-lg font-semibold mb-2">{client.name ?? "-"}</p>

        <div className="flex w-full justify-between items-center gap-2">
          {/* Группа связи */}
          <div className="flex items-center gap-x-2">
            <Button
              variant="default"
              size="sm"
              asChild
              disabled={!client.phone}
            >
              <Link href={`tel:${client.phone ?? ""}`}>
                <PhoneCall size={16} className="mr-2" /> Позвонить
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={!client.phone}
            >
              <Link href={`sms:${client.phone ?? ""}`}>
                <MessageCircle size={16} />
              </Link>
            </Button>
          </div>

          {/* Группа управления */}
          <div className="flex items-center gap-x-2">
            <EditClient client={client} />
            <DeleteClient onDelete={handleDelete} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Item;
