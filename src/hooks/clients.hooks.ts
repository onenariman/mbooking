import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addClient,
  deleteClient,
  fetchClients,
  updateClient,
} from "../api/clients.api";
import {
  ClientArraySchema,
  clientSchema,
  ZodClient,
} from "../schemas/clients/clientSchema";

export const useClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<ZodClient[]> => {
      const rawData = await fetchClients();

      const result = ClientArraySchema.safeParse(rawData);

      if (!result.success) {
        console.error("Zod validation failed:", result.error.issues);
        throw new Error("Данные не прошли валидацию");
      }

      return result.data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};

export const useAddClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: Partial<ZodClient>): Promise<ZodClient> => {
      const result = clientSchema
        .partial()
        .pick({ name: true, phone: true })
        .safeParse(client);

      if (!result.success) {
        const msg = result.error.issues.map((i) => i.message).join(", ");
        throw new Error(msg);
      }

      return addClient(client);
    },
    onSuccess: (newClient) => {
      queryClient.setQueryData<ZodClient[]>(["clients"], (oldClients = []) => {
        return [newClient, ...oldClients];
      });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ZodClient>;
    }) => updateClient(id, updates),

    // 🔥 OPTIMISTIC UPDATE
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: ["clients"],
      });

      const previousClients = queryClient.getQueryData<ZodClient[]>([
        "clients",
      ]);

      queryClient.setQueryData<ZodClient[]>(["clients"], (old) =>
        old?.map((client) =>
          client.id === id ? { ...client, ...updates } : client,
        ),
      );

      return { previousClients };
    },

    // 🔁 ROLLBACK
    onError: (_err, _vars, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(["clients"], context.previousClients);
      }
    },

    // 🔄 SYNC WITH SERVER
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients"],
      });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),

    // Оптимистичное удаление
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["clients"] });

      const previousClients = queryClient.getQueryData<ZodClient[]>([
        "clients",
      ]);

      queryClient.setQueryData<ZodClient[]>(["clients"], (old) =>
        old?.filter((c) => c.id !== id),
      );

      return { previousClients };
    },

    // Rollback, если ошибка
    onError: (_err, _id, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData<ZodClient[]>(
          ["clients"],
          context.previousClients,
        );
      }
    },

    // Синхронизация с сервером
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};
