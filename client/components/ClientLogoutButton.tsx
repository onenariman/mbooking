"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientPortalLogout } from "@/client/actions/auth";
import { Button } from "@/components/ui/button";

export function ClientLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await clientPortalLogout();
      router.replace("/client/login");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось выйти");
    }
  };

  return (
    <Button type="button" variant="outline" onClick={() => void handleLogout()}>
      Выйти
    </Button>
  );
}
