"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { activateClientInviteAndLogin } from "@/client/actions/activate-invite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useValidateClientInvite } from "@/src/hooks/clientPortal.hooks";

export function ClientInviteActivationForm({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const validate = useValidateClientInvite(token);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");

  const invite = validate.data;
  const isPasswordReset = invite?.purpose === "password_reset";

  const loadingInvite = validate.isPending && !validate.isFetched;
  const validateFailed = validate.isError;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!invite) {
      setErrorMessage("Приглашение недоступно");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isPasswordReset && !normalizedEmail) {
      setErrorMessage("Введите email");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Пароль должен содержать не менее 8 символов");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Пароли не совпадают");
      return;
    }

    try {
      setIsPending(true);
      await activateClientInviteAndLogin({
        token,
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
        password,
        confirm_password: confirmPassword,
      });
    } catch (error) {
      const message = getErrorMessage(error, "Не удалось активировать кабинет");
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  };

  if (loadingInvite) {
    return <p className="text-sm text-muted-foreground">Проверяем приглашение...</p>;
  }

  if (validateFailed) {
    return (
      <>
        <CardHeader className="px-0 pt-0">
          <CardTitle>Приглашение</CardTitle>
          <CardDescription>
            Не удалось загрузить данные ссылки. Проверьте интернет и попробуйте снова.
          </CardDescription>
        </CardHeader>
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {getErrorMessage(
                validate.error,
                "Приглашение недоступно",
              )}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 border-destructive/30"
              onClick={() => void validate.refetch()}
            >
              Повторить
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CardHeader className="px-0 pt-0">
        <CardTitle>
          {isPasswordReset ? "Новый пароль кабинета" : "Активация кабинета"}
        </CardTitle>
        <CardDescription>
          {isPasswordReset
            ? "Задайте новый пароль для входа в личный кабинет клиента. Email для входа не меняется."
            : "Укажите email и задайте пароль для входа в личный кабинет клиента."}
        </CardDescription>
      </CardHeader>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        {urlError === "activate" && urlMessage ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
            {decodeURIComponent(urlMessage)}
          </div>
        ) : null}
        {urlError === "nest-unconfigured" ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
            Не настроен URL Nest на сервере Next.
          </div>
        ) : null}

        {!isPasswordReset ? (
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email для входа</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="invite-password">Новый пароль</Label>
          <Input
            id="invite-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="invite-password-confirm">Повтор пароля</Label>
          <Input
            id="invite-password-confirm"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <Button type="submit" disabled={isPending || !invite}>
          {isPending
            ? isPasswordReset
              ? "Сохраняем..."
              : "Активируем..."
            : isPasswordReset
              ? "Сохранить пароль"
              : "Активировать кабинет"}
        </Button>
      </form>
    </>
  );
}
