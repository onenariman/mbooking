"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Edit2Icon,
  EllipsisVertical,
  MessageCircle,
  Phone,
  Send,
  Trash2,
} from "lucide-react";
import { ZodClient } from "@/src/schemas/clients/clientSchema";
import { useCreateFeedbackToken } from "@/src/hooks/feedback.hooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditClient } from "./EditClient";

export function DropdownMenuClient({
  client,
  onDelete,
}: {
  client: ZodClient;
  onDelete: () => Promise<void>;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutateAsync: createFeedbackToken, isPending: isCreatingToken } =
    useCreateFeedbackToken();

  const phone = client.phone ?? "";
  const whatsappPhone = phone.replace(/\D/g, "");

  const handleSendFeedback = async () => {
    try {
      const token = await createFeedbackToken("14 days");
      const appBaseUrl = (
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      ).replace(/\/$/, "");
      const feedbackLink = `${appBaseUrl}/feedback/${token}`;
      const feedbackMessage = [
        "Пожалуйста, оставьте анонимный отзыв.",
        "",
        feedbackLink,
        "",
        "Спасибо!",
      ].join("\n");
      const encodedFeedbackMessage = encodeURIComponent(feedbackMessage);

      if (whatsappPhone) {
        window.open(
          `https://wa.me/${whatsappPhone}?text=${encodedFeedbackMessage}`,
          "_blank",
          "noopener,noreferrer",
        );
        toast.success("Ссылка на отзыв открыта в WhatsApp");
        return;
      }

      if (phone.trim()) {
        window.location.href = `sms:${phone}?&body=${encodedFeedbackMessage}`;
        toast.success("Ссылка на отзыв добавлена в SMS");
        return;
      }

      await navigator.clipboard.writeText(feedbackLink);
      toast.success("Ссылка на отзыв скопирована");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка отправки ссылки",
      );
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      setShowDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <EllipsisVertical size={20} className="text-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem asChild disabled={!phone}>
            <Link href={`tel:${phone}`}>
              <Phone className="mr-2 h-4 w-4" />
              Позвонить
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild disabled={!whatsappPhone}>
            <Link
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
              WhatsApp
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSendFeedback}
            disabled={isCreatingToken || (!phone.trim() && !whatsappPhone)}
          >
            <Send className="mr-2 h-4 w-4 text-foreground" />
            Отзыв
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Edit2Icon className="mr-2 h-4 w-4 text-blue-500" />
            Изменить
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDelete(true)}
            className="text-red-500 focus:bg-red-50 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить клиента?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Клиент будет удален из базы данных.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditClient client={client} open={showEdit} onOpenChange={setShowEdit} />
    </>
  );
}
