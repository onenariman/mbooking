import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { IService } from "@/components/service/type/service.type";

interface IServices {
  services: IService[];
  loading: boolean;
  error: string | null;

  fetchServices: () => Promise<void>;
  addService: (name: string, category: string) => Promise<boolean>;
}

export const useServicesStore = create<IServices>((set) => ({
  services: [],
  loading: true,
  error: null,

  fetchServices: async () => {
    const supabase = createClient();
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    set({ services: data ?? [], error: null, loading: false });
  },

  addService: async (name, category) => {
    const supabase = createClient();
    set({ error: null, loading: true });

    try {
      const { data: exists, error: checkError } = await supabase
        .from("services")
        .select("id")
        .eq("name", name)
        .maybeSingle();

      if (checkError) throw checkError;

      if (exists) {
        set({ error: "Услуга с таким именем уже существует" });
        return false;
      }

      const { data, error } = await supabase
        .from("services")
        .insert({ name, category })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        services: [data, ...state.services],
      }));

      return true;
    } catch (err) {
      if (err instanceof Error) {
        set({ error: err.message });
      }
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
