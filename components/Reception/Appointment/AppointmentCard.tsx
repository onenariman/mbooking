"use client";

import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Phone, MessageCircle, Send } from "lucide-react";

interface Props {
  type: "electro" | "cosmetology" | "massage" | "laser";
  status: "pending" | "confirmed" | "cancelled";
}

export default function AppointmentCard({ type, status }: Props) {
  const variants = {
    electro: { service: "Электроэпиляция", client: "Зарема", time: "14:00" },
    cosmetology: { service: "Косметология", client: "Алина", time: "16:30" },
    massage: { service: "Массаж", client: "Мария", time: "11:00" },
    laser: { service: "Лазерная терапия", client: "Светлана", time: "18:00" },
  };

  const statusMap = {
    pending: { text: "Ожидает", color: "bg-amber-100 text-amber-700" },
    confirmed: {
      text: "Подтверждено",
      color: "bg-emerald-100 text-emerald-700",
    },
    cancelled: { text: "Отменено", color: "bg-rose-100 text-rose-700" },
  };

  const data = variants[type];
  const statusData = statusMap[status];

  return (
    <Card className="py-2 px-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col space-y-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold truncate">{data.service}</h3>

            <Badge
              variant="secondary"
              className={`text-xs px-2 py-0.5 ${statusData.color}`}
            >
              {statusData.text}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground truncate">
            {data.client} / {data.time}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={6} className="w-44">
            <DropdownMenuItem>
              <Phone className="mr-2 h-4 w-4" />
              Позвонить
            </DropdownMenuItem>

            <DropdownMenuItem>
              <MessageCircle className="mr-2 h-4 w-4" />
              Написать
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Send className="mr-2 h-4 w-4 text-emerald-600" />
              WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
