"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Edit2Icon,
  EllipsisVertical,
  MessageCircle,
  Percent,
  Phone,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import { useCreateDiscount } from "@/src/hooks/discounts.hooks";
import { useCreateFeedbackToken } from "@/src/hooks/feedback.hooks";
import { useServices } from "@/src/hooks/services.hook";
import { ZodClient } from "@/src/schemas/clients/clientSchema";
import {
  formatPhoneDisplay,
  normalizePhone,
} from "@/src/validators/normalizePhone";
import { EditClient } from "./EditClient";

export function DropdownMenuClient({
  client,
  onDelete,
}: {
  client: ZodClient;
  onDelete: () => Promise<void>;
}) {
  const [showCreateDiscount, setShowCreateDiscount] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountNote, setDiscountNote] = useState("");
  const [discountServiceId, setDiscountServiceId] = useState<string | null>(null);
  const { data: services = [] } = useServices();
  const { mutateAsync: createDiscount, isPending: isCreatingDiscount } =
    useCreateDiscount();
  const { mutateAsync: createFeedbackToken, isPending: isCreatingToken } =
    useCreateFeedbackToken();

  const rawPhone = client.phone ?? "";
  const normalizedPhone = normalizePhone(rawPhone);
  const phone = normalizedPhone || rawPhone.trim();
  const whatsappPhone = normalizedPhone || rawPhone.replace(/\D/g, "");
  const formattedPhone = phone ? formatPhoneDisplay(phone) : rawPhone;
  const selectedServiceName = useMemo(() => {
    return services.find((service) => service.id === discountServiceId)?.name ?? null;
  }, [discountServiceId, services]);

  const resetDiscountForm = () => {
    setDiscountPercent("");
    setDiscountNote("");
    setDiscountServiceId(null);
  };

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
        window.location.assign(`sms:${phone}?&body=${encodedFeedbackMessage}`);
        toast.success("Ссылка на отзыв добавлена в SMS");
        return;
      }

      await navigator.clipboard.writeText(feedbackLink);
      toast.success("Ссылка на отзыв скопирована");
    } catch (error) {
      toast.error(getErrorMessage(error, "Ошибка отправки ссылки"));
    }
  };

  const handleCreateDiscount = async () => {
    const parsedPercent = Number(discountPercent);

    if (!phone) {
      toast.error("У клиента нет корректного номера телефона");
      return;
    }

    if (!discountServiceId) {
      toast.error("Выберите услугу для скидки");
      return;
    }

    if (!Number.isInteger(parsedPercent) || parsedPercent < 1 || parsedPercent > 100) {
      toast.error("Введите скидку от 1 до 100%");
      return;
    }

    try {
      await createDiscount({
        client_phone: phone,
        discount_percent: parsedPercent,
        service_id: discountServiceId,
        note: discountNote.trim() || null,
      });
      toast.success(
        selectedServiceName
          ? `Скидка назначена на услугу "${selectedServiceName}"`
          : "Скидка назначена клиенту",
      );
      resetDiscountForm();
      setShowCreateDiscount(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось назначить скидку"));
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
          <DropdownMenuItem
            onClick={() => setShowCreateDiscount(true)}
            disabled={!phone}
          >
            <Percent className="mr-2 h-4 w-4 text-orange-500" />
            Назначить скидку
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

      <Dialog
        open={showCreateDiscount}
        onOpenChange={(open) => {
          setShowCreateDiscount(open);
          if (!open) {
            resetDiscountForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить скидку</DialogTitle>
            <DialogDescription>
              Скидка привяжется к клиенту {formattedPhone} и к конкретной услуге.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="discount-service">Услуга</Label>
              <Select
                value={discountServiceId ?? undefined}
                onValueChange={setDiscountServiceId}
              >
                <SelectTrigger id="discount-service" className="w-full">
                  <SelectValue placeholder="Выберите услугу" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-percent">Скидка, %</Label>
              <Input
                id="discount-percent"
                inputMode="numeric"
                maxLength={3}
                placeholder="Например, 10"
                value={discountPercent}
                onChange={(event) =>
                  setDiscountPercent(event.target.value.replace(/\D/g, "").slice(0, 3))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-note">Комментарий</Label>
              <Textarea
                id="discount-note"
                placeholder="Например, лояльность или компенсация"
                value={discountNote}
                onChange={(event) => setDiscountNote(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDiscount(false)}
              disabled={isCreatingDiscount}
            >
              Отмена
            </Button>
            <Button onClick={handleCreateDiscount} disabled={isCreatingDiscount}>
              {isCreatingDiscount ? "Сохраняем..." : "Назначить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
