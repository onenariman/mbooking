"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import type { ClientPortalMe } from "@/src/api/clientPortal.api";
import {
  useClientPortalMe,
  usePatchClientPortalSettings,
} from "@/src/hooks/clientPortal.hooks";

const ALLOWED_OFFSETS = [5, 15, 30, 60, 120, 180] as const;
const MAX_OFFSETS = 3;

function toggleOffset(
  current: number[],
  value: number,
): number[] {
  const set = new Set(current);
  if (set.has(value)) {
    set.delete(value);
  } else {
    if (set.size >= MAX_OFFSETS) {
      return current;
    }
    set.add(value);
  }
  return [...set].sort((a, b) => b - a);
}

function offsetLabel(m: number): string {
  if (m < 60) {
    return `${m} мин`;
  }
  const h = m / 60;
  if (h === 1) {
    return "1 ч";
  }
  if (h >= 2 && h <= 4) {
    return `${h} ч`;
  }
  return `${h} ч`;
}

function ClientSettingsFormInner({
  view,
  isMeError,
  meError,
  refetch,
  isRefetching,
}: {
  view: ClientPortalMe;
  isMeError: boolean;
  meError: unknown;
  refetch: () => void;
  isRefetching: boolean;
}) {
  const patch = usePatchClientPortalSettings();

  const [email, setEmail] = useState(view.email ?? "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    view.notifications_enabled,
  );
  const [offsets, setOffsets] = useState<number[]>(
    view.client_reminder_offsets_minutes,
  );
  const [quietStart, setQuietStart] = useState(
    view.quiet_hours_start_utc ?? "",
  );
  const [quietEnd, setQuietEnd] = useState(view.quiet_hours_end_utc ?? "");

  const saveEmail = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Введите email");
      return;
    }
    patch.mutate(
      { email: trimmed },
      {
        onSuccess: () => toast.success("Email сохранён"),
        onError: (error) =>
          toast.error(getErrorMessage(error, "Не удалось сохранить email")),
      },
    );
  };

  const handleCheckedChange = (checked: boolean) => {
    const previous = notificationsEnabled;
    setNotificationsEnabled(checked);
    patch.mutate(
      { notifications_enabled: checked },
      {
        onSuccess: () => {
          toast.success(
            checked
              ? "Уведомления в кабинете включены"
              : "Уведомления в кабинете отключены",
          );
        },
        onError: (error) => {
          setNotificationsEnabled(previous);
          toast.error(
            getErrorMessage(error, "Не удалось сохранить настройки"),
          );
        },
      },
    );
  };

  const saveReminders = () => {
    const qhStart = quietStart.trim() || null;
    const qhEnd = quietEnd.trim() || null;
    if (qhStart && !/^\d{2}:\d{2}$/.test(qhStart)) {
      toast.error("Начало тишины: формат ЧЧ:ММ (UTC)");
      return;
    }
    if (qhEnd && !/^\d{2}:\d{2}$/.test(qhEnd)) {
      toast.error("Конец тишины: формат ЧЧ:ММ (UTC)");
      return;
    }
    if ((qhStart && !qhEnd) || (!qhStart && qhEnd)) {
      toast.error("Укажите оба времени тишины или очистите оба поля");
      return;
    }
    patch.mutate(
      {
        client_reminder_offsets_minutes: offsets,
        quiet_hours_start_utc: qhStart,
        quiet_hours_end_utc: qhEnd,
      },
      {
        onSuccess: () =>
          toast.success("Настройки напоминаний сохранены"),
        onError: (error) =>
          toast.error(
            getErrorMessage(error, "Не удалось сохранить напоминания"),
          ),
      },
    );
  };

  const busy = patch.isPending;

  return (
    <div className="grid gap-6">
      {isMeError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {getErrorMessage(
                meError,
                "Не удалось загрузить настройки. Проверьте соединение.",
              )}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 border-destructive/30"
              onClick={() => void refetch()}
            >
              Повторить
            </Button>
          </div>
        </div>
      ) : null}

      {isRefetching && !busy ? (
        <p className="text-xs text-muted-foreground">Обновляем данные…</p>
      ) : null}

      <div className="grid gap-2 rounded-2xl border p-4">
        <Label htmlFor="client-email" className="text-base">
          Email для входа
        </Label>
        <p className="text-sm text-muted-foreground">
          Используется для входа в кабинет вместе с паролем.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="client-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="sm:max-w-sm"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void saveEmail()}
          >
            {busy ? "Сохранение..." : "Сохранить email"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border p-4">
        <div className="space-y-1">
          <Label htmlFor="client-notifications" className="text-base">
            Уведомления в кабинете
          </Label>
          <p className="text-sm text-muted-foreground">
            Согласие на push-уведомления в браузере (если вы их включили).
          </p>
        </div>

        <Switch
          id="client-notifications"
          checked={notificationsEnabled}
          disabled={busy}
          onCheckedChange={(c) => void handleCheckedChange(c)}
        />
      </div>

      <div className="grid gap-3 rounded-2xl border p-4">
        <div>
          <p className="text-base font-medium">Напоминания о записях</p>
          <p className="text-sm text-muted-foreground">
            Push о предстоящей записи (не больше трёх интервалов). Пустой список
            — только мастер получает напоминания, не клиент.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALLOWED_OFFSETS.map((m) => {
            const active = offsets.includes(m);
            return (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                disabled={busy}
                onClick={() => setOffsets((o) => toggleOffset(o, m))}
              >
                {offsetLabel(m)}
              </Button>
            );
          })}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label htmlFor="quiet-start">Тишина с (UTC)</Label>
            <Input
              id="quiet-start"
              placeholder="22:00"
              value={quietStart}
              disabled={busy}
              onChange={(e) => setQuietStart(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="quiet-end">Тишина до (UTC)</Label>
            <Input
              id="quiet-end"
              placeholder="08:00"
              value={quietEnd}
              disabled={busy}
              onChange={(e) => setQuietEnd(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Время без рассылки в формате UTC. Окно может переходить через полночь
          (например 22:00–08:00). Очистите оба поля, чтобы отключить.
        </p>
        <Button
          type="button"
          disabled={busy}
          onClick={() => void saveReminders()}
        >
          {busy ? "Сохранение..." : "Сохранить напоминания"}
        </Button>
      </div>
    </div>
  );
}

export function ClientSettingsForm({ initialMe }: { initialMe: ClientPortalMe }) {
  const { data: me, isError, error, refetch, isRefetching } =
    useClientPortalMe(initialMe);
  const view = me ?? initialMe;
  const key = useMemo(
    () =>
      `${view.auth_user_id}|${view.email ?? ""}|${view.notifications_enabled}|${view.client_reminder_offsets_minutes.join(
        ",",
      )}|${view.quiet_hours_start_utc ?? ""}|${view.quiet_hours_end_utc ?? ""}`,
    [view],
  );

  return (
    <ClientSettingsFormInner
      key={key}
      view={view}
      isMeError={isError}
      meError={error}
      refetch={() => void refetch()}
      isRefetching={isRefetching}
    />
  );
}
