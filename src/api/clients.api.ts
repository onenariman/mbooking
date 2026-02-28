import { createClient } from "@/src/utils/supabase/client";
import { ZodClient } from "../schemas/clients/clientSchema";

const supabase = createClient();

type ClientCreateInput = Pick<ZodClient, "name" | "phone">;
type ClientUpdateInput = Partial<ClientCreateInput>;

export const fetchClients = async (): Promise<ZodClient[]> => {
  const { data, error } = await supabase.from("clients").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data as ZodClient[];
};

export const addClient = async (
  client: ClientCreateInput,
): Promise<ZodClient> => {
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ZodClient;
};

export const deleteClient = async (id: string) => {
  const { data, error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const updateClient = async (id: string, updates: ClientUpdateInput) => {
  const { error } = await supabase.from("clients").update(updates).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return { id, updates };
};

