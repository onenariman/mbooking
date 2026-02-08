import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { ZodCategory } from "@/src/schemas/categories/categorySchema";
import EditCategory from "./EditCategory";

export function DropdownMenuCategory({
  category,
  onDelete,
}: {
  category: ZodCategory;
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

      <EditCategory
        category={category}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
