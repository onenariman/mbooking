"use client";

import { ZodClient } from "@/src/schemas/clients/clientSchema";
import { useDeleteClient } from "@/src/hooks/clients.hooks";
import { formatPhoneDisplay } from "@/src/validators/normalizePhone";
import { toast } from "sonner";
import { DropdownMenuClient } from "./DropdownMenuClient";

interface ItemProps {
  client: ZodClient;
}

const ItemClient = ({ client }: ItemProps) => {
  const { mutateAsync: deleteClient } = useDeleteClient();

  const handleDelete = async () => {
    await deleteClient(client.id);
    toast.success("Клиент удалён");
  };

  const initial = (client.name ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm transition-[box-shadow,transform] active:scale-[0.995] md:gap-3.5 md:p-4 md:hover:shadow-md">
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary"
        aria-hidden
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight tracking-tight text-foreground">
          {client.name}
        </p>
        <p className="mt-1 text-sm tabular-nums text-muted-foreground">
          {formatPhoneDisplay(client.phone)}
        </p>
      </div>
      <div className="shrink-0">
        <DropdownMenuClient client={client} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default ItemClient;
