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

const CLIENTS_QUERY_KEY = ["clients"] as const;

type ClientCreateInput = Parameters<typeof addClient>[0];
type ClientUpdateInput = Parameters<typeof updateClient>[1];

interface UpdateClientPayload {
  id: string;
  updates: ClientUpdateInput;
}

export const useClients = () => {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: async (): Promise<ZodClient[]> => {
      const rawData = await fetchClients();
      const result = ClientArraySchema.safeParse(rawData);

      if (!result.success) {
        console.error("Zod validation failed:", result.error.issues);
        throw new Error("Данные клиентов не прошли валидацию");
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
    mutationFn: async (client: ClientCreateInput): Promise<ZodClient> => {
      const result = clientSchema.pick({ name: true, phone: true }).safeParse(client);

      if (!result.success) {
        const message = result.error.issues.map((issue) => issue.message).join(", ");
        throw new Error(message);
      }

      return addClient(result.data);
    },
    onSuccess: (newClient) => {
      queryClient.setQueryData<ZodClient[]>(CLIENTS_QUERY_KEY, (oldClients = []) => [
        newClient,
        ...oldClients,
      ]);
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: UpdateClientPayload) => updateClient(id, updates),
    // Оптимистично обновляем список, чтобы интерфейс не "мигал".
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: CLIENTS_QUERY_KEY });

      const previousClients = queryClient.getQueryData<ZodClient[]>(CLIENTS_QUERY_KEY);

      queryClient.setQueryData<ZodClient[]>(CLIENTS_QUERY_KEY, (old) =>
        old?.map((client) => (client.id === id ? { ...client, ...updates } : client)),
      );

      return { previousClients };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(CLIENTS_QUERY_KEY, context.previousClients);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: CLIENTS_QUERY_KEY });

      const previousClients = queryClient.getQueryData<ZodClient[]>(CLIENTS_QUERY_KEY);

      queryClient.setQueryData<ZodClient[]>(CLIENTS_QUERY_KEY, (old) =>
        old?.filter((client) => client.id !== id),
      );

      return { previousClients };
    },
    onError: (_err, _id, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData<ZodClient[]>(CLIENTS_QUERY_KEY, context.previousClients);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
};

