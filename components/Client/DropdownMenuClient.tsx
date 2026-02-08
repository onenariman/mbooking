import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditClient } from "./EditClient";
import { ZodClient } from "@/src/schemas/clients/clientSchema";
import { useState } from "react";
import { EllipsisVertical } from "lucide-react";

export function DropdownMenuClient({
  client,
  onDelete,
}: {
  client: ZodClient;
  onDelete: () => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Изменить
          </DropdownMenuItem>

          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sheet вынесен отдельно */}
      <EditClient client={client} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
