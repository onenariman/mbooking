import { z } from "zod";

export const clientSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  name: z.string(),
  phone: z.string(),
  user_id: z.string(),
});

export const ClientArraySchema = z.array(clientSchema);

export type ZodClient = z.infer<typeof clientSchema>;
