"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Edit2Icon,
  EllipsisVertical,
  MessageCircle,
  Phone,
  Trash2,
} from "lucide-react";
import { ZodClient } from "@/src/schemas/clients/clientSchema";
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

  const phone = client.phone ?? "";
  const whatsappPhone = phone.replace(/\D/g, "");

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
