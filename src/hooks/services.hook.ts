import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addService,
  deleteService,
  fetchServices,
  updateService,
} from "../api/services.api";
import {
  ServiceArraySchema,
  serviceSchema,
  ZodService,
} from "../schemas/services/serviceSchema";

const SERVICES_QUERY_KEY = ["services"] as const;

type ServiceCreateInput = Parameters<typeof addService>[0];
type ServiceUpdateInput = Parameters<typeof updateService>[1];

interface UpdateServicePayload {
  id: string;
  updates: ServiceUpdateInput;
}

export const useServices = () => {
  return useQuery({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: async (): Promise<ZodService[]> => {
      const rawData = await fetchServices();
      const result = ServiceArraySchema.safeParse(rawData);

      if (!result.success) {
        console.error("Zod validation failed:", result.error.issues);
        throw new Error("Данные услуг не прошли валидацию");
      }

      return result.data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};

export const useAddService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: ServiceCreateInput): Promise<ZodService> => {
      const result = serviceSchema
        .pick({ name: true, category_id: true, price: true })
        .safeParse(service);

      if (!result.success) {
        const message = result.error.issues.map((issue) => issue.message).join(", ");
        throw new Error(message);
      }

      return addService(result.data);
    },
    onSuccess: (newService) => {
      queryClient.setQueryData<ZodService[]>(SERVICES_QUERY_KEY, (old = []) => [
        newService,
        ...old,
      ]);
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: SERVICES_QUERY_KEY });

      const previousServices = queryClient.getQueryData<ZodService[]>(SERVICES_QUERY_KEY);

      queryClient.setQueryData<ZodService[]>(SERVICES_QUERY_KEY, (old) =>
        old?.filter((service) => service.id !== id),
      );

      return { previousServices };
    },
    onError: (_err, _id, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData<ZodService[]>(
          SERVICES_QUERY_KEY,
          context.previousServices,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
};

export const useUpdateServices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: UpdateServicePayload) => updateService(id, updates),
    // Оптимистичное обновление карточки услуги до ответа сервера.
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: SERVICES_QUERY_KEY });

      const previousServices = queryClient.getQueryData<ZodService[]>(SERVICES_QUERY_KEY);

      queryClient.setQueryData<ZodService[]>(SERVICES_QUERY_KEY, (old) =>
        old?.map((service) =>
          service.id === id ? { ...service, ...updates } : service,
        ),
      );

      return { previousServices };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(SERVICES_QUERY_KEY, context.previousServices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
};

