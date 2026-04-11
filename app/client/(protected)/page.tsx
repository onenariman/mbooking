import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getClientPortalAppointments,
  getClientPortalContextFromSession,
  getClientPortalDiscounts,
} from "@/client/server/context";
import { formatAppointmentLabel } from "@/src/lib/appointments/formatAppointmentLabel";
import { getAppointmentStatusLabel } from "@/src/lib/appointments/getAppointmentStatusLabel";

export default async function ClientHomePage() {
  const context = await getClientPortalContextFromSession();

  if (!context) {
    redirect("/client/login");
  }

  const [appointments, discounts] = await Promise.all([
    getClientPortalAppointments(context),
    getClientPortalDiscounts(context),
  ]);

  const nextAppointment = appointments.upcoming[0] ?? null;
  const lastVisit = appointments.history.find((item) => item.status === "completed") ?? null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Ближайшая запись</CardTitle>
          <CardDescription>
            Здесь отображается ваш следующий визит.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nextAppointment ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{nextAppointment.service_name}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatAppointmentLabel(
                    nextAppointment.appointment_at,
                    nextAppointment.appointment_end,
                  ) || "Время уточняется"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Статус: {getAppointmentStatusLabel(nextAppointment.status)}
              </p>
              <Button asChild>
                <Link href="/client/appointments">Смотреть все записи</Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Пока нет будущих записей. Когда администратор создаст новую запись,
              она появится здесь.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Активные скидки</CardTitle>
          <CardDescription>
            Доступные персональные предложения на услуги.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-4xl font-semibold">{discounts.active.length}</p>
          <Button asChild variant="outline">
            <Link href="/client/discounts">Открыть скидки</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Последний завершенный визит</CardTitle>
          <CardDescription>
            История визитов будет постепенно наполняться в кабинете.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lastVisit ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{lastVisit.service_name}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatAppointmentLabel(
                    lastVisit.appointment_at,
                    lastVisit.appointment_end,
                  ) || "Дата недоступна"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Итоговая стоимость:{" "}
                {typeof lastVisit.amount === "number"
                  ? `${lastVisit.amount.toLocaleString("ru-RU")} ₽`
                  : "не указана"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Завершенных визитов пока нет.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
