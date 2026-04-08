import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getClientPortalContextFromSession,
  getClientPortalDiscounts,
} from "@/src/server/client-portal/context";

export default async function ClientDiscountsPage() {
  const context = await getClientPortalContextFromSession();

  if (!context) {
    redirect("/client/login");
  }

  const { active, archive } = await getClientPortalDiscounts(context);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Активные скидки</CardTitle>
          <CardDescription>
            Действующие скидки, которыми можно воспользоваться при следующей записи.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {active.length ? (
            active.map((discount) => (
              <div key={discount.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{discount.discount_percent}%</Badge>
                  <span className="font-medium">
                    {discount.service_name_snapshot || "Выбранная услуга"}
                  </span>
                </div>
                {discount.expires_at ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Действует до {new Date(discount.expires_at).toLocaleString("ru-RU")}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Без ограничения по сроку
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Активных скидок сейчас нет.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Архив скидок</CardTitle>
          <CardDescription>
            Здесь отображаются использованные и истекшие скидки.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {archive.length ? (
            archive.map((discount) => (
              <div key={discount.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{discount.discount_percent}%</Badge>
                  <span className="font-medium">
                    {discount.service_name_snapshot || "Выбранная услуга"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {discount.is_used ? "Скидка использована" : "Срок действия закончился"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Архив скидок пока пуст.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
