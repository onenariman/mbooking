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

export const useServices = () => {
  return useQuery({
    queryKey: ["services"],
    queryFn: async (): Promise<ZodService[]> => {
      const rawData = await fetchServices();

      const result = ServiceArraySchema.safeParse(rawData);

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

export const useAddService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      service: Pick<ZodService, "name" | "category_id" | "price">,
    ): Promise<ZodService> => {
      const result = serviceSchema
        .pick({ name: true, category_id: true, price: true })
        .safeParse(service);

      if (!result.success) {
        throw new Error(result.error.issues.map((i) => i.message).join(", "));
      }

      return addService(service);
    },

    onSuccess: (newService) => {
      queryClient.setQueryData<ZodService[]>(["services"], (old = []) => [
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

    // Оптимистичное удаление
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["services"] });

      const previousServices = queryClient.getQueryData<ZodService[]>([
        "services",
      ]);

      queryClient.setQueryData<ZodService[]>(["services"], (old) =>
        old?.filter((s) => s.id !== id),
      );

      return { previousServices };
    },

    // Rollback, если ошибка
    onError: (_err, _id, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData<ZodService[]>(
          ["services"],
          context.previousServices,
        );
      }
    },

    // Синхронизация с сервером
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
};

export const useUpdateServices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ZodService>;
    }) => updateService(id, updates),

    // 🔥 OPTIMISTIC UPDATE
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: ["services"],
      });

      const previousServices = queryClient.getQueryData<ZodService[]>([
        "services",
      ]);

      queryClient.setQueryData<ZodService[]>(["services"], (old) =>
        old?.map((service) =>
          service.id === id ? { ...service, ...updates } : service,
        ),
      );

      return { previousServices };
    },

    // 🔁 ROLLBACK
    onError: (_err, _vars, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(["services"], context.previousServices);
      }
    },

    // 🔄 SYNC WITH SERVER
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["services"],
      });
    },
  });
};
