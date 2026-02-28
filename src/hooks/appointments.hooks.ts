import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAppointment,
  deleteAppointment,
  fetchAppointments,
  updateAppointment,
} from "../api/receptions.api";
import {
  AppointmentArraySchema,
  createAppointmentSchema,
  ZodAppointment,
} from "../schemas/books/bookSchema";

const APPOINTMENTS_QUERY_KEY = ["appointments"] as const;

type AppointmentInput = Parameters<typeof addAppointment>[0];
type AppointmentUpdateInput = Parameters<typeof updateAppointment>[1];

interface UpdateAppointmentPayload {
  id: string;
  updates: AppointmentUpdateInput;
}

type DateFilter = {
  from?: string | null;
  to?: string | null;
};

export const useAppointments = (filter?: DateFilter) => {
  return useQuery({
    queryKey: [...APPOINTMENTS_QUERY_KEY, filter?.from, filter?.to],
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

export const useAddAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: AppointmentInput): Promise<ZodAppointment> => {
      const result = createAppointmentSchema.safeParse(appointment);
      if (!result.success) {
        const message = result.error.issues.map((issue) => issue.message).join(", ");
        throw new Error(message);
      }

      return addAppointment(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: APPOINTMENTS_QUERY_KEY,
      });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: UpdateAppointmentPayload) =>
      updateAppointment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
  });
};

