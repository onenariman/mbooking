import { loginOwnerWithPassword } from "@/app/login/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Только при `DEV_OWNER_PASSWORD_LOGIN=true` на Next (см. OwnerLoginCard). */
export function OwnerDevPasswordLogin() {
  return (
    <div className="mt-6 grid gap-4 border-t border-border pt-6">
      <p className="text-muted-foreground text-xs">
        Dev: вход по паролю (включите на Nest{" "}
        <code className="text-foreground">OWNER_PASSWORD_LOGIN_ENABLED=true</code>).
      </p>
      <form action={loginOwnerWithPassword} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="dev-owner-email">Email</Label>
          <Input
            id="dev-owner-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dev-owner-password">Пароль</Label>
          <Input
            id="dev-owner-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" variant="secondary" className="w-full">
          Войти по паролю (dev)
        </Button>
      </form>
    </div>
  );
}
