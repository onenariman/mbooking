import { createClient } from "@/src/utils/supabase/client";
import { ZodService } from "../schemas/services/serviceSchema";

const supabase = createClient();

type ServiceCreateInput = Pick<ZodService, "name" | "category_id" | "price">;
type ServiceUpdateInput = Partial<
  Pick<ZodService, "name" | "category_id" | "price">
>;

export const fetchServices = async () => {
  const { error, data } = await supabase.from("services").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const addService = async (
  service: ServiceCreateInput,
): Promise<ZodService> => {
  const { data, error } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ZodService;
};

export const deleteService = async (id: string) => {
  const { data, error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const updateService = async (
  id: string,
  updates: ServiceUpdateInput,
) => {
  const { error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  return { id, updates };
};
