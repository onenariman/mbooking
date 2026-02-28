"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteAppointment } from "@/src/hooks/appointments.hooks";

interface DeleteBookProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteBook = ({ id, open, onOpenChange }: DeleteBookProps) => {
  const { mutateAsync: deleteAppointment, isPending } = useDeleteAppointment();

  const handleDelete = async () => {
    try {
      await deleteAppointment(id);
      toast.success("Запись удалена");
      onOpenChange(false);
    } catch {
      toast.error("Ошибка при удалении");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить запись?</DialogTitle>
          <DialogDescription>
            Это действие нельзя отменить. Запись будет навсегда удалена из базы
            данных.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
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

