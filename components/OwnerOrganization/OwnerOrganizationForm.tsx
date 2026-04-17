"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import InputPhone from "@/components/InputPhone";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import { patchOwnerOrganizationSchema } from "@/src/schemas/owner-organization/ownerOrganizationSchema";
import {
  useOwnerOrganization,
  usePatchOwnerOrganization,
} from "@/src/hooks/ownerOrganization.hooks";

function normalizeNull(v: string): string | null {
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function OwnerOrganizationFormFields({
  email,
  initialFullName,
  initialPhoneDigits,
  initialInn,
}: {
  email: string;
  initialFullName: string;
  initialPhoneDigits: string;
  initialInn: string;
}) {
  const patch = usePatchOwnerOrganization();

  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhoneDigits);
  const [inn, setInn] = useState(initialInn);

  const busy = patch.isPending;
  const changed = useMemo(
    () =>
      initialFullName !== fullName ||
      initialPhoneDigits !== phone ||
      initialInn !== inn,
    [initialFullName, initialPhoneDigits, initialInn, fullName, phone, inn],
  );

  const save = () => {
    const candidate = {
      full_name: normalizeNull(fullName),
      phone: normalizeNull(phone),
      inn: normalizeNull(inn),
    };

    const parsed = patchOwnerOrganizationSchema.safeParse(candidate);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте поля формы");
      return;
    }

    patch.mutate(parsed.data, {
      onSuccess: () => toast.success("Данные сохранены"),
      onError: (err) =>
        toast.error(getErrorMessage(err, "Не удалось сохранить данные")),
    });
  };

  return (
    <>
      <div className="grid gap-2 rounded-2xl border p-4">
        <Label className="text-base">Email для входа</Label>
        <p className="text-sm text-muted-foreground">
          Используется для входа через Яндекс ID и не редактируется здесь.
        </p>
        <Input
          type="email"
          value={email}
          readOnly
          disabled
          className="sm:max-w-sm"
        />
      </div>

      <div className="grid gap-4 rounded-2xl border p-4">
        <div className="grid gap-2">
          <Label htmlFor="org-full-name" className="text-base">
            ФИО
          </Label>
          <Input
            id="org-full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Например: Иванов Иван Иванович"
            autoComplete="name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="org-phone" className="text-base">
            Телефон
          </Label>
          <div id="org-phone">
            <InputPhone value={phone} onChange={setPhone} />
          </div>
          <p className="text-xs text-muted-foreground">
            Вводите только цифры — префикс +7 подставляется автоматически.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="org-inn" className="text-base">
            ИНН
          </Label>
          <Input
            id="org-inn"
            value={inn}
            onChange={(e) => setInn(e.target.value)}
            placeholder="10 или 12 цифр"
            inputMode="numeric"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Все поля кроме email — опциональные.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !changed}
            onClick={() => void save()}
          >
            {busy ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>
    </>
  );
}

export function OwnerOrganizationForm() {
  const { data, isError, error, refetch, isRefetching, isPending, isFetched } =
    useOwnerOrganization();

  if (isPending && !isFetched) {
    return <p className="text-sm text-muted-foreground">Загружаем…</p>;
  }

  const key = data
    ? `${data.email}|${data.full_name ?? ""}|${data.phone ?? ""}|${data.inn ?? ""}`
    : "empty";

  return (
    <div className="grid gap-6">
      {isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {getErrorMessage(
                error,
                "Не удалось загрузить данные. Проверьте соединение.",
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

      {isRefetching ? (
        <p className="text-xs text-muted-foreground">Обновляем данные…</p>
      ) : null}

      {data ? (
        <div key={key} className="grid gap-6">
          <OwnerOrganizationFormFields
            email={data.email}
            initialFullName={data.full_name ?? ""}
            initialPhoneDigits={data.phone ? data.phone.slice(1) : ""}
            initialInn={data.inn ?? ""}
          />
        </div>
      ) : null}
    </div>
  );
}

