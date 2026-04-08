"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import { createClient } from "@/src/utils/supabase/client";

type InvitePayload = {
  client_phone: string;
  client_phone_display: string;
  client_name: string | null;
  purpose: string;
  expires_at: string;
};

export function ClientInviteActivationForm({ token }: { token: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validateInvite = async () => {
      try {
        const response = await fetch(`/api/client/invitations/${token}/validate`, {
          cache: "no-store",
        });
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
      const response = await fetch(`/api/client/invitations/${token}/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            data?: {
              client_phone: string;
              client_phone_display: string;
            };
            message?: string;
          }
        | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message || "Не удалось активировать кабинет");
      }

      await supabase.auth.signOut();

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Кабинет активирован", {
        description: "Теперь вы можете пользоваться личным кабинетом",
      });
      router.replace("/client");
      router.refresh();
    } catch (error) {
      const message = getErrorMessage(error, "Не удалось активировать кабинет");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Проверяем приглашение...</p>;
  }

  if (!invite) {
    return <p className="text-sm text-destructive">{errorMessage}</p>;
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="invite-phone">Телефон</Label>
        <Input id="invite-phone" value={invite.client_phone_display} readOnly />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="client@example.com"
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
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="invite-confirm-password">Повторите пароль</Label>
        <Input
          id="invite-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Активируем..." : "Активировать кабинет"}
      </Button>
    </form>
  );
}
