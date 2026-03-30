import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDiscount,
  fetchDiscounts,
  markDiscountAsUsed,
} from "@/src/api/discounts.api";
import {
  createDiscountSchema,
  discountArraySchema,
  ZodCreateDiscount,
  ZodDiscount,
} from "@/src/schemas/discounts/discountSchema";
import { normalizePhone } from "@/src/validators/normalizePhone";
import { QUERY_OPTIONS } from "@/src/lib/queryConfig";

const DISCOUNTS_QUERY_KEY = ["discounts"] as const;

type UseDiscountsFilter = {
  phone?: string | null;
  serviceId?: string | null;
  isUsed?: boolean;
};

export const useDiscounts = (filter?: UseDiscountsFilter) => {
  const normalizedPhone = filter?.phone ? normalizePhone(filter.phone) : null;
  const hasPhoneFilter = Object.prototype.hasOwnProperty.call(filter ?? {}, "phone");
  const hasServiceFilter = Object.prototype.hasOwnProperty.call(
    filter ?? {},
    "serviceId",
  );

  return useQuery({
    queryKey: [
      ...DISCOUNTS_QUERY_KEY,
      normalizedPhone,
      filter?.serviceId ?? null,
      filter?.isUsed,
    ],
    queryFn: async (): Promise<ZodDiscount[]> => {
      if (hasPhoneFilter && !normalizedPhone) {
        return [];
      }

      if (hasServiceFilter && !filter?.serviceId) {
        return [];
      }

      const rawData = await fetchDiscounts({
        phone: normalizedPhone,
        serviceId: filter?.serviceId,
        isUsed: filter?.isUsed,
      });
      const parsed = discountArraySchema.safeParse(rawData);

      if (!parsed.success) {
        console.error("Zod validation failed:", parsed.error.issues);
        throw new Error("Данные скидок не прошли валидацию");
      }

      return parsed.data;
    },
    enabled:
      (hasPhoneFilter ? Boolean(normalizedPhone) : true) &&
      (hasServiceFilter ? Boolean(filter?.serviceId) : true),
    ...QUERY_OPTIONS.live,
  });
};

export const useUseDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markDiscountAsUsed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNTS_QUERY_KEY });
    },
  });
};

export const useCreateDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ZodCreateDiscount) => {
      const parsed = createDiscountSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((issue) => issue.message).join(", "));
      }

      return createDiscount(parsed.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNTS_QUERY_KEY });
    },
  });
};
