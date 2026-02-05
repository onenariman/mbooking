import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  created_at: z.string(),
  category_name: z.string(),
  user_id: z.string(),
});

export const categoryArraySchema = z.array(categorySchema);

export type ZodCategory = z.infer<typeof categorySchema>;
