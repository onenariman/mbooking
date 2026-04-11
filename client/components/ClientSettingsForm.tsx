"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import {
  nestClientPortalFetch,
  nestErrorMessage,
} from "@/src/utils/api/nestOwnerApi";

export function ClientSettingsForm({
  initialNotificationsEnabled,
}: {
  initialNotificationsEnabled: boolean;
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialNotificationsEnabled,
  );
  const [isPending, setIsPending] = useState(false);

  const handleCheckedChange = async (checked: boolean) => {
    try {
      setIsPending(true);
      const response = await nestClientPortalFetch("client/settings", {
        method: "PATCH",
        body: JSON.stringify({
          notifications_enabled: checked,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.message || (await nestErrorMessage(response)),
        );
      }

      setNotificationsEnabled(checked);
      toast.success(
        checked
          ? "Настройка уведомлений сохранена"
          : "Уведомления в кабинете отключены",
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить настройки"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border p-4">
      <div className="space-y-1">
        <Label htmlFor="client-notifications" className="text-base">
          Уведомления в кабинете
        </Label>
        <p className="text-sm text-muted-foreground">
          Эта настройка сохранит ваше согласие на будущие клиентские уведомления.
        </p>
      </div>

      <Switch
        id="client-notifications"
        checked={notificationsEnabled}
        disabled={isPending}
        onCheckedChange={handleCheckedChange}
      />
    </div>
  );
}
