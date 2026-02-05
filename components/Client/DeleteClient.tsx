"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteConfirmProps {
  onDelete: () => Promise<void>;
}

export const DeleteClient = ({ onDelete }: DeleteConfirmProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="text-destructive">
          <Trash size={18} />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить клиента?</DialogTitle>
          <p>
            Вы точно хотите удалить этого клиента? Действие нельзя отменить.
          </p>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline">Отмена</Button>
          <Button
            variant="destructive"
            onClick={async () => {
              setIsDeleting(true);
              try {
                await onDelete();
              } catch {
                toast.error("Ошибка при удалении");
              } finally {
                setIsDeleting(false);
              }
            }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Удалить"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
