import { z } from "zod";

export const serviceSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  user_id: z.string(),
  name: z.string(),
  category_id: z.string().nullable(),
  price: z.number().nullable(),
});

export const ServiceArraySchema = z.array(serviceSchema);
export type ZodService = z.infer<typeof serviceSchema>;
