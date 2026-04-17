import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getClientPortalAppointments,
  getClientPortalContextFromSession,
} from "@/client/server/context";
import { formatAppointmentLabel } from "@/src/lib/appointments/formatAppointmentLabel";
import { getAppointmentStatusLabel } from "@/src/lib/appointments/getAppointmentStatusLabel";

export default async function ClientAppointmentsPage() {
  const context = await getClientPortalContextFromSession();

  if (!context) {
    redirect("/client/login");
  }

  const { upcoming, history } = await getClientPortalAppointments(context);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Будущие записи</CardTitle>
          <CardDescription>
            Предстоящие визиты к мастеру по вашему номеру телефона.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length ? (
            upcoming.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{appointment.service_name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatAppointmentLabel(
                      appointment.appointment_at,
                      appointment.appointment_end,
                    ) || "Время уточняется"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Статус: {getAppointmentStatusLabel(appointment.status)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Будущих записей пока нет.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История</CardTitle>
          <CardDescription>
            Последние завершенные, отмененные и прошедшие визиты.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length ? (
            history.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{appointment.service_name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatAppointmentLabel(
                      appointment.appointment_at,
                      appointment.appointment_end,
                    ) || "Дата недоступна"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Статус: {getAppointmentStatusLabel(appointment.status)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              История визитов пока пуста.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
