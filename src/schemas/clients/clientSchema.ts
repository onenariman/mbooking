import { z } from "zod";

export const clientSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  user_id: z.string(),
});

export const ClientArraySchema = z.array(clientSchema);

export type ZodClient = z.infer<typeof clientSchema>;
