import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Edit2Icon, EllipsisVertical, Trash2 } from "lucide-react";
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
            <Edit2Icon className="h-4 w-4 text-blue-500" />
            Изменить
          </DropdownMenuItem>

          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
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
