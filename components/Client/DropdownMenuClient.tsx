"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Edit2Icon,
  EllipsisVertical,
  KeyRound,
  MessageCircle,
  Percent,
  Phone,
  RotateCcw,
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
  const [isCreatingPortalInvite, setIsCreatingPortalInvite] = useState(false);
  const [isCreatingPasswordResetInvite, setIsCreatingPasswordResetInvite] =
    useState(false);
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

  const handleSendClientInvite = async () => {
    if (!phone) {
      toast.error("У клиента нет корректного номера телефона");
      return;
    }

    try {
      setIsCreatingPortalInvite(true);

      const { nestOwnerFetch } = await import("@/src/utils/api/nestOwnerApi");
      const response = await nestOwnerFetch("client/invitations", {
        method: "POST",
        body: JSON.stringify({
          client_id: client.id,
          client_user_id: client.user_id,
          client_phone: phone,
          purpose: "activation",
          expires_in_hours: 24 * 7,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            data?: {
              invitation_link: string;
            };
            message?: string;
          }
        | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message || "Не удалось создать приглашение");
      }

      const invitationLink = payload.data.invitation_link;
      const invitationMessage = [
        "Ваш личный кабинет клиента готов к активации.",
        "",
        "Откройте ссылку и задайте пароль:",
        invitationLink,
        "",
        "Ссылка действует 7 дней.",
      ].join("\n");
      const encodedMessage = encodeURIComponent(invitationMessage);

      if (whatsappPhone) {
        window.open(
          `https://wa.me/${whatsappPhone}?text=${encodedMessage}`,
          "_blank",
          "noopener,noreferrer",
        );
        toast.success("Приглашение в кабинет открыто в WhatsApp");
        return;
      }

      if (phone.trim()) {
        window.location.assign(`sms:${phone}?&body=${encodedMessage}`);
        toast.success("Приглашение в кабинет добавлено в SMS");
        return;
      }

      await navigator.clipboard.writeText(invitationLink);
      toast.success("Ссылка-приглашение скопирована");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Не удалось отправить приглашение в кабинет"),
      );
    } finally {
      setIsCreatingPortalInvite(false);
    }
  };

  const handleSendPasswordResetInvite = async () => {
    if (!phone) {
      toast.error("У клиента нет корректного номера телефона");
      return;
    }

    try {
      setIsCreatingPasswordResetInvite(true);

      const { nestOwnerFetch } = await import("@/src/utils/api/nestOwnerApi");
      const response = await nestOwnerFetch("client/invitations", {
        method: "POST",
        body: JSON.stringify({
          client_id: client.id,
          client_user_id: client.user_id,
          client_phone: phone,
          purpose: "password_reset",
          expires_in_hours: 24,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            data?: {
              invitation_link: string;
            };
            message?: string;
          }
        | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message || "Не удалось создать ссылку");
      }

      const invitationLink = payload.data.invitation_link;
      const invitationMessage = [
        "Ссылка для смены пароля личного кабинета:",
        "",
        invitationLink,
        "",
        "Если кабинет ещё не активирован — сначала отправьте приглашение на активацию.",
      ].join("\n");
      const encodedMessage = encodeURIComponent(invitationMessage);

      if (whatsappPhone) {
        window.open(
          `https://wa.me/${whatsappPhone}?text=${encodedMessage}`,
          "_blank",
          "noopener,noreferrer",
        );
        toast.success("Ссылка сброса пароля открыта в WhatsApp");
        return;
      }

      if (phone.trim()) {
        window.location.assign(`sms:${phone}?&body=${encodedMessage}`);
        toast.success("Ссылка сброса пароля добавлена в SMS");
        return;
      }

      await navigator.clipboard.writeText(invitationLink);
      toast.success("Ссылка сброса пароля скопирована");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Не удалось создать ссылку сброса пароля"),
      );
    } finally {
      setIsCreatingPasswordResetInvite(false);
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
              <Phone className="h-4 w-4 text-muted-foreground" />
              Позвонить
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild disabled={!whatsappPhone}>
            <Link
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              WhatsApp
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSendFeedback}
            disabled={isCreatingToken || (!phone.trim() && !whatsappPhone)}
          >
            <Send className="h-4 w-4 text-muted-foreground" />
            Отзыв
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSendClientInvite}
            disabled={isCreatingPortalInvite || (!phone.trim() && !whatsappPhone)}
          >
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Пригласить в кабинет
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSendPasswordResetInvite}
            disabled={
              isCreatingPasswordResetInvite || (!phone.trim() && !whatsappPhone)
            }
          >
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
            Сброс пароля кабинета
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowCreateDiscount(true)}
            disabled={!phone}
          >
            <Percent className="h-4 w-4 text-muted-foreground" />
            Назначить скидку
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Edit2Icon className="h-4 w-4 text-blue-500" />
            Изменить
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setShowDelete(true)}>
            <Trash2 />
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
