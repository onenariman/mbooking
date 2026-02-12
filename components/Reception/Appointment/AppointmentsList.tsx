"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Phone,
  MessageCircle,
  Send,
  Check,
  X,
} from "lucide-react";

type Status = "pending" | "confirmed" | "cancelled";
type Category = "all" | "electro" | "cosmetology" | "massage" | "laser";

interface Appointment {
  id: number;
  type: Exclude<Category, "all">;
  status: Status;
  client: string;
  time: string; // "HH:mm"
  date: string; // "YYYY-MM-DD"
  amount?: number;
}

interface Props {
  categoryFilter: Category;
  statusFilter: "all" | Status;
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

export default function AppointmentsList({
  categoryFilter,
  statusFilter,
  dateFrom,
  dateTo,
}: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 1,
      type: "electro",
      status: "pending",
      client: "Зарема",
      date: "2026-02-11",
      time: "14:00",
    },
    {
      id: 2,
      type: "cosmetology",
      status: "pending",
      client: "Алина",
      date: "2026-02-11",
      time: "16:30",
    },
    {
      id: 3,
      type: "massage",
      status: "confirmed",
      client: "Мария",
      date: "2026-02-10",
      time: "11:00",
    },
    {
      id: 4,
      type: "laser",
      status: "cancelled",
      client: "Светлана",
      date: "2026-02-11",
      time: "18:00",
    },
  ]);

  const [activeConfirmId, setActiveConfirmId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState<number>(0);

  const handleConfirm = (id: number) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "confirmed", amount: amountInput } : a,
      ),
    );
    setActiveConfirmId(null);
    setAmountInput(0);
  };

  const handleCancel = (id: number) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)),
    );
  };

  const statusMap = {
    pending: { text: "Ожидает", color: "bg-amber-100 text-amber-700" },
    confirmed: {
      text: "Подтверждено",
      color: "bg-emerald-100 text-emerald-700",
    },
    cancelled: { text: "Отменено", color: "bg-rose-100 text-rose-700" },
  };

  const variants = {
    electro: "Электроэпиляция",
    cosmetology: "Косметология",
    massage: "Массаж",
    laser: "Лазерная терапия",
  };

  // Фильтруем записи по категории, статусу и дате
  const filtered = appointments
    .filter((a) => categoryFilter === "all" || a.type === categoryFilter)
    .filter((a) => statusFilter === "all" || a.status === statusFilter)
    .filter((a) => {
      if (!dateFrom || !dateTo) return true;
      const apptDate = new Date(a.date);
      apptDate.setHours(
        Number(a.time.split(":")[0]),
        Number(a.time.split(":")[1]),
        0,
        0,
      );

      return (
        apptDate.getTime() >= dateFrom.getTime() &&
        apptDate.getTime() <= dateTo.getTime()
      );
    });

  return (
    <div className="space-y-4">
      {filtered.map((a) => (
        <Card key={a.id} className="py-2 px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col space-y-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-sm font-semibold truncate">
                  {variants[a.type]}
                </h3>
                <Badge
                  variant="secondary"
                  className={`text-xs px-2 py-0.5 ${statusMap[a.status].color}`}
                >
                  {statusMap[a.status].text}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {a.client} / {a.date} {a.time} {a.amount && `• ${a.amount}₽`}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={6} className="w-56">
                <DropdownMenuItem>
                  <Phone className="mr-2 h-4 w-4" /> Позвонить
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageCircle className="mr-2 h-4 w-4" /> Написать
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Send className="mr-2 h-4 w-4 text-emerald-600" /> WhatsApp
                </DropdownMenuItem>

                <div className="border-t my-1" />

                {a.status === "pending" && (
                  <>
                    {activeConfirmId === a.id ? (
                      <div className="p-2 flex flex-col gap-2">
                        <input
                          type="number"
                          placeholder="Сумма"
                          value={amountInput}
                          onChange={(e) =>
                            setAmountInput(Number(e.target.value))
                          }
                          className="border p-1 rounded"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => handleConfirm(a.id)}>
                            ОК
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveConfirmId(null)}
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={() => setActiveConfirmId(a.id)}
                        >
                          <Check className="mr-2 h-4 w-4" /> Подтвердить
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCancel(a.id)}
                          className="text-red-600"
                        >
                          <X className="mr-2 h-4 w-4" /> Отменить
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ))}
    </div>
  );
}
