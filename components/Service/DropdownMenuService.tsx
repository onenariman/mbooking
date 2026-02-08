import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { ZodService } from "@/src/schemas/services/serviceSchema";
import { EditService } from "./EditService";

export function DropdownMenuService({
  service,
  onDelete,
}: {
  service: ZodService;
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

      <EditService
        service={service}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
