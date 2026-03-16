import { z } from "zod";

export const serviceSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  user_id: z.string(),
  name: z
    .string()
    .min(1, "Название услуги обязательно")
    .max(255, "Название услуги слишком длинное"),
  category_id: z.string().nullable(),
  price: z.number().nullable(),
});

export const ServiceArraySchema = z.array(serviceSchema);
export type ZodService = z.infer<typeof serviceSchema>;
