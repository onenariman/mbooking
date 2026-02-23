import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  fetchAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment,
} from "../api/receptions.api";
import {
  AppointmentArraySchema,
  createAppointmentSchema,
  ZodAppointment,
} from "../schemas/books/bookSchema";

type DateFilter = {
  from?: string | null;
  to?: string | null;
};

type AppointmentInput = Parameters<typeof addAppointment>[0];
type AppointmentUpdateInput = Parameters<typeof updateAppointment>[1];

// -------------------- ПОЛУЧЕНИЕ ЗАПИСЕЙ --------------------
export const useAppointments = (filter?: DateFilter) => {
  return useQuery({
    queryKey: ["appointments", filter?.from, filter?.to],
    queryFn: async (): Promise<ZodAppointment[]> => {
      const rawData = await fetchAppointments({
        from: filter?.from ?? null,
        to: filter?.to ?? null,
      });

      const result = AppointmentArraySchema.safeParse(rawData);
      if (!result.success) {
        console.error("Zod validation failed:", result.error.issues);
        throw new Error("Данные записей не прошли валидацию");
      }

      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

// -------------------- ДОБАВЛЕНИЕ ЗАПИСИ --------------------
export const useAddAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      appointment: AppointmentInput,
    ): Promise<ZodAppointment> => {
      // Валидация перед отправкой
      const result = createAppointmentSchema.safeParse(appointment);
      if (!result.success) {
        const msg = result.error.issues.map((i) => i.message).join(", ");
        throw new Error(msg);
      }
      return addAppointment(appointment);
    },
    // Ключевое изменение здесь:
    onSuccess: () => {
      // Инвалидируем все запросы, которые начинаются с "appointments"
      // Это заставит BookList мгновенно обновиться актуальными данными из БД
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });
};

// -------------------- ОБНОВЛЕНИЕ ЗАПИСИ --------------------
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: AppointmentUpdateInput;
    }) => updateAppointment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

// -------------------- УДАЛЕНИЕ ЗАПИСИ --------------------
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
