"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { activateClientInviteAndLogin } from "@/app/client/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import { nestPublicV1Fetch } from "@/src/utils/api/nestOwnerApi";
import { Alert, AlertDescription } from "@/components/ui/alert";

type InvitePayload = {
  client_phone: string;
  client_phone_display: string;
  client_name: string | null;
  purpose: string;
  expires_at: string;
};

export function ClientInviteActivationForm({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");

  useEffect(() => {
    let isMounted = true;

    const validateInvite = async () => {
      try {
        const response = await nestPublicV1Fetch(
          `client/invitations/${encodeURIComponent(token)}/validate`,
          { method: "GET", cache: "no-store" },
        );
        const payload = (await response.json().catch(() => null)) as
          | { data?: InvitePayload; message?: string }
          | null;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.message || "Приглашение недоступно");
        }

        if (isMounted) {
          setInvite(payload.data);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error, "Не удалось проверить приглашение"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void validateInvite();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!invite) {
      setErrorMessage("Приглашение недоступно");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
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
        email: normalizedEmail,
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

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Проверяем приглашение...</p>;
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {urlError === "activate" && urlMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{decodeURIComponent(urlMessage)}</AlertDescription>
        </Alert>
      ) : null}
      {urlError === "nest-unconfigured" ? (
        <Alert variant="destructive">
          <AlertDescription>Не настроен URL Nest на сервере Next.</AlertDescription>
        </Alert>
      ) : null}

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

      <div className="grid gap-2">
        <Label htmlFor="invite-password">Пароль</Label>
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
        {isPending ? "Активируем..." : "Активировать кабинет"}
      </Button>
    </form>
  );
}
