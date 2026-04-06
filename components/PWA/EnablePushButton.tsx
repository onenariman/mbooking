"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, BellRing, Save, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  fetchPushSettings,
  isPushSupported,
  registerServiceWorker,
  removePushSubscription,
  savePushSettings,
  savePushSubscription,
  sendTestPush,
  urlBase64ToUint8Array,
} from "@/src/lib/push/client";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const defaultAllowedOffsets = [5, 15, 30, 60, 120, 180];

const formatOffsetLabel = (offsetMinutes: number) => {
  if (offsetMinutes < 60) {
    return `${offsetMinutes} мин`;
  }

  const hours = offsetMinutes / 60;
  if (hours === 1) {
    return "1 час";
  }
  if (hours >= 2 && hours <= 4) {
    return `${hours} часа`;
  }

  return `${hours} часов`;
};

const areEqualOffsets = (left: number[], right: number[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export default function EnablePushButton() {
  const [allowedOffsets, setAllowedOffsets] = useState<number[]>(defaultAllowedOffsets);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [maxSelected, setMaxSelected] = useState(3);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [savedOffsets, setSavedOffsets] = useState<number[]>([]);
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([]);

  const statusLabel = useMemo(() => {
    if (!isSupported) {
      return "Браузер не поддерживает push";
    }

    if (!vapidPublicKey) {
      return "Серверные push-ключи еще не настроены";
    }

    if (permission === "denied") {
      return "Уведомления заблокированы в браузере";
    }

    if (isSubscribed) {
      return "Уведомления для мастера включены";
    }

    return "Уведомления пока выключены";
  }, [isSubscribed, isSupported, permission]);

  const reminderSummary = useMemo(() => {
    if (selectedOffsets.length === 0) {
      return "Напоминания по записям отключены";
    }

    return selectedOffsets.map((offset) => formatOffsetLabel(offset)).join(", ");
  }, [selectedOffsets]);

  const settingsChanged = useMemo(
    () => !areEqualOffsets(selectedOffsets, savedOffsets),
    [savedOffsets, selectedOffsets],
  );

  const syncState = async () => {
    const supported = isPushSupported();
    setIsSupported(supported);

    if (!supported) {
      return;
    }

    setPermission(Notification.permission);

    const registration = await registerServiceWorker();
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(Boolean(subscription));
  };

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const settings = await fetchPushSettings();

      setAllowedOffsets(settings.allowed_offsets_minutes);
      setMaxSelected(settings.max_selected);
      setSavedOffsets(settings.reminder_offsets_minutes);
      setSelectedOffsets(settings.reminder_offsets_minutes);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось загрузить настройки уведомлений";
      toast.error(message);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    void syncState();
    void loadSettings();
  }, []);

  const handleEnable = async () => {
    if (!isSupported) {
      toast.error("Этот браузер не поддерживает push-уведомления");
      return;
    }

    if (!vapidPublicKey) {
      toast.error("Push-ключи еще не настроены");
      return;
    }

    try {
      setIsBusy(true);

      const registration = await registerServiceWorker();
      let currentPermission = Notification.permission;

      if (currentPermission === "default") {
        currentPermission = await Notification.requestPermission();
      }

      setPermission(currentPermission);

      if (currentPermission !== "granted") {
        toast.error("Нужно разрешить уведомления в браузере");
        return;
      }

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          userVisibleOnly: true,
        });
      }

      await savePushSubscription(subscription);
      setIsSubscribed(true);
      toast.success("Уведомления для мастера включены");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось включить push";
      toast.error(message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisable = async () => {
    try {
      setIsBusy(true);

      const registration = await registerServiceWorker();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success("Уведомления отключены");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось отключить уведомления";
      toast.error(message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleTest = async () => {
    try {
      setIsBusy(true);
      await sendTestPush();
      toast.success("Тестовое уведомление отправлено");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось отправить тестовый push";
      toast.error(message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleOffset = (offset: number, checked: boolean | "indeterminate") => {
    if (checked === true) {
      if (selectedOffsets.includes(offset)) {
        return;
      }

      if (selectedOffsets.length >= maxSelected) {
        toast.error(`Можно выбрать не больше ${maxSelected} напоминаний`);
        return;
      }

      setSelectedOffsets((current) => [...current, offset].sort((left, right) => right - left));
      return;
    }

    setSelectedOffsets((current) => current.filter((value) => value !== offset));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true);
      const settings = await savePushSettings(selectedOffsets);

      setAllowedOffsets(settings.allowed_offsets_minutes);
      setMaxSelected(settings.max_selected);
      setSavedOffsets(settings.reminder_offsets_minutes);
      setSelectedOffsets(settings.reminder_offsets_minutes);

      toast.success(
        settings.reminder_offsets_minutes.length > 0
          ? "Интервалы напоминаний сохранены"
          : "Напоминания по записям отключены",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить настройки уведомлений";
      toast.error(message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="cursor-pointer" aria-label="Уведомления">
          {isSubscribed ? <BellRing /> : permission === "denied" ? <BellOff /> : <Bell />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-4 p-4" align="end" sideOffset={8}>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Уведомления мастера</p>
          <p className="text-sm text-muted-foreground">{statusLabel}</p>
        </div>

        <div className="flex flex-col gap-2">
          {isSubscribed ? (
            <Button onClick={handleDisable} disabled={isBusy} variant="outline">
              Отключить уведомления
            </Button>
          ) : (
            <Button
              onClick={handleEnable}
              disabled={isBusy || !isSupported || !vapidPublicKey || permission === "denied"}
            >
              Включить уведомления
            </Button>
          )}

          <Button onClick={handleTest} disabled={isBusy || !isSubscribed} variant="secondary">
            <SendHorizontal className="mr-2 h-4 w-4" />
            Отправить тест
          </Button>
        </div>

        <div className="space-y-3 rounded-xl border p-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Напоминания по записям</p>
            <p className="text-xs text-muted-foreground">
              Выберите до {maxSelected} интервалов. Они будут применяться ко всем
              записям мастера, максимум за 3 часа до визита.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {allowedOffsets.map((offset) => {
              const isChecked = selectedOffsets.includes(offset);

              return (
                <label
                  key={offset}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => handleToggleOffset(offset, checked)}
                    aria-label={`Напоминание за ${formatOffsetLabel(offset)}`}
                  />
                  <span>{formatOffsetLabel(offset)}</span>
                </label>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Сейчас выбрано: {isLoadingSettings ? "загрузка..." : reminderSummary}
          </p>

          <Button
            onClick={handleSaveSettings}
            disabled={isSavingSettings || isLoadingSettings || !settingsChanged}
            variant="secondary"
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            Сохранить интервалы
          </Button>
        </div>

        {permission === "denied" ? (
          <p className="text-xs text-muted-foreground">
            Разрешение заблокировано. Включите уведомления вручную в настройках браузера.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
