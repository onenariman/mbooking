"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NotebookPen } from "lucide-react";
import { toast } from "sonner";

interface BookDescriptionProps {
  notes: string | null;
}

const BookDescription = ({ notes }: BookDescriptionProps) => {
  const normalizedNotes = notes?.trim() ?? "";

  if (!normalizedNotes) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(normalizedNotes);
      toast.success("Комментарий скопирован");
    } catch {
      toast.error("Не удалось скопировать комментарий");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon">
          <NotebookPen size={18} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Комментарий</AlertDialogTitle>
          <AlertDialogDescription>{normalizedNotes}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Закрыть</AlertDialogCancel>
          <AlertDialogAction onClick={handleCopy}>
            Скопировать
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BookDescription;
