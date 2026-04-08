"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/src/utils/supabase/client";

export function ClientLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    router.replace("/client/login");
    router.refresh();
  };

  return (
    <Button type="button" variant="outline" onClick={handleLogout}>
      Выйти
    </Button>
  );
}
