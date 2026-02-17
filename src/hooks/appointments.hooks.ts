import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAppointment,
  deleteAppointment,
  fetchAppointments,
  updateAppointment,
} from "../api/receptions.api"; // Проверь путь к API
import {
  AppointmentArraySchema,
  appointmentSchema,
  ZodAppointment,
} from "../schemas/books/bookSchema"; // Проверь путь к схеме

// 1. ПОЛУЧЕНИЕ ВСЕХ ЗАПИСЕЙ
export const useAppointments = () => {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async (): Promise<ZodAppointment[]> => {
      const rawData = await fetchAppointments();

      // Валидируем массив данных, пришедший с сервера
      const result = AppointmentArraySchema.safeParse(rawData);

      if (!result.success) {
        console.error("Zod validation failed:", result.error.issues);
        throw new Error("Данные записей не прошли валидацию");
      }

      return result.data;
    },
    staleTime: Infinity, // Данные не протухают автоматически
    refetchOnWindowFocus: false,
  });
};

// 2. ДОБАВЛЕНИЕ ЗАПИСИ
export const useAddAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      appointment: Partial<ZodAppointment>,
    ): Promise<ZodAppointment> => {
      // Валидация перед отправкой (проверяем, что объект в целом корректен)
      const result = appointmentSchema.partial().safeParse(appointment);

      if (!result.success) {
        const msg = result.error.issues.map((i) => i.message).join(", ");
        throw new Error(msg);
      }

      return addAppointment(appointment);
    },
    onSuccess: (newAppointment) => {
      // Мгновенно добавляем новую запись в кэш без перезагрузки
      queryClient.setQueryData<ZodAppointment[]>(
        ["appointments"],
        (oldAppointments = []) => {
          return [newAppointment, ...oldAppointments];
        },
      );
    },
  });
};

// 3. ОБНОВЛЕНИЕ ЗАПИСИ (Optimistic UI)
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ZodAppointment>;
    }) => updateAppointment(id, updates),

    // 🔥 OPTIMISTIC UPDATE: Меняем интерфейс до ответа сервера
    onMutate: async ({ id, updates }) => {
      // Отменяем текущие запросы, чтобы они не перезаписали наше оптимистичное обновление
      await queryClient.cancelQueries({
        queryKey: ["appointments"],
      });

      // Сохраняем предыдущее состояние (снимок) для возможного отката
      const previousAppointments = queryClient.getQueryData<ZodAppointment[]>([
        "appointments",
      ]);

      // Обновляем кэш вручную
      queryClient.setQueryData<ZodAppointment[]>(["appointments"], (old) =>
        old?.map((appointment) =>
          appointment.id === id ? { ...appointment, ...updates } : appointment,
        ),
      );

      return { previousAppointments };
    },

    // 🔁 ROLLBACK: Если сервер вернул ошибку, возвращаем всё как было
    onError: (_err, _vars, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          ["appointments"],
          context.previousAppointments,
        );
      }
    },

    // 🔄 SYNC WITH SERVER: В любом случае обновляем данные с сервера для надежности
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });
};

// 4. УДАЛЕНИЕ ЗАПИСИ (Optimistic UI)
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),

    // Оптимистичное удаление
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["appointments"] });

      const previousAppointments = queryClient.getQueryData<ZodAppointment[]>([
        "appointments",
      ]);

      // Убираем запись из списка визуально
      queryClient.setQueryData<ZodAppointment[]>(["appointments"], (old) =>
        old?.filter((app) => app.id !== id),
      );

      return { previousAppointments };
    },

    // Rollback при ошибке
    onError: (_err, _id, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData<ZodAppointment[]>(
          ["appointments"],
          context.previousAppointments,
        );
      }
    },

    // Синхронизация
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
