import { createClient } from "@/src/utils/supabase/client";
import { ZodClient } from "../schemas/clients/clientSchema";

const supabase = createClient();

export const fetchClients = async () => {
  const { data, error } = await supabase.from("clients").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const addClient = async (
  client: Partial<ZodClient>,
): Promise<ZodClient> => {
  const { data, error } = await supabase
    .from("clients")
    .insert([client])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ZodClient;
};

export const deleteClient = async (id: string) => {
  const { data, error } = await supabase.from("clients").delete().eq("id", id);

  if (error) throw error;
  return data;
};

export const updateClient = async (id: string, updates: Partial<ZodClient>) => {
  const { error } = await supabase.from("clients").update(updates).eq("id", id);
  if (error) throw error;
  return { id, updates };
};
