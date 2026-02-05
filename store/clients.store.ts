import { create } from "zustand";
import { IClient } from "@/components/client/type/client.type";
import { createClient } from "@/utils/supabase/client";

interface IClients {
  clients: IClient[];
  loading: boolean;
  error: string | null;

  fetchClients: () => Promise<void>;
  addClient: (name: string, phone: string) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
  updateClient: (id: string, updates: Partial<IClient>) => Promise<boolean>;
}

export const useClientsStore = create<IClients>((set) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async () => {
    const supabase = createClient();
    set({ loading: true, error: null }); // 1️⃣ говорим "загрузка началась"

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      set({ error: error.message, loading: false }); // 2️⃣ ошибка → останавливаем loading
      return;
    }

    set({ clients: data ?? [], error: null, loading: false }); // 3️⃣ всё ок → останавливаем loading
  },

  addClient: async (name, phone) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      // проверяем, существует ли клиент
      const { data: exists, error: checkError } = await supabase
        .from("clients")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (checkError) throw checkError;

      if (exists) {
        set({ error: "Клиент с таким номером уже существует" });
        return false;
      }

      // добавляем
      const { data, error } = await supabase
        .from("clients")
        .insert({ name, phone })
        .select()
        .single();

      if (error) throw error;

      // обновляем store сразу
      set((state) => ({
        clients: [data, ...state.clients],
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

  deleteClient: async (id) => {
    const supabase = createClient();

    // 1️⃣ Создаем переменные для "бэкапа"
    let removedClient: IClient | undefined;
    let removedIndex: number = -1;

    set((state) => {
      // Находим индекс и самого клиента ПЕРЕД удалением
      removedIndex = state.clients.findIndex((c) => c.id === id);
      removedClient = state.clients[removedIndex];

      return {
        // Удаляем из стейта (UI обновится мгновенно)
        clients: state.clients.filter((c) => c.id !== id),
        loading: true,
        error: null,
      };
    });

    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;

      return true;
    } catch (err) {
      // 2️⃣ Если ошибка — восстанавливаем на то же место
      if (removedClient && removedIndex !== -1) {
        set((state) => {
          const restoredClients = [...state.clients];
          // Метод splice вставляет элемент по указанному индексу
          restoredClients.splice(removedIndex, 0, removedClient!);

          return {
            clients: restoredClients,
            error: err instanceof Error ? err.message : "Ошибка удаления",
          };
        });
      }
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateClient: async (id, updates) => {
    const supabase = createClient();
    // 1. Создаем переменную-буфер вне set, чтобы она была доступна в catch
    let oldClient: IClient | undefined;

    // 2. Оптимистично обновляем стейт
    set((state) => {
      // Сохраняем копию данных до изменений
      oldClient = state.clients.find((c) => c.id === id);

      return {
        clients: state.clients.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
        loading: true,
      };
    });

    try {
      // 3. Отправляем запрос в Supabase
      const { error } = await supabase
        .from("clients")
        .update(updates) // Отправляем только частичные изменения
        .eq("id", id);

      if (error) throw error;

      // Если дошли сюда — всё успешно
      return true;
    } catch (err) {
      // 4. Если база вернула ошибку — делаем Rollback (откат)
      if (oldClient) {
        set((state) => ({
          clients: state.clients.map(
            (c) => (c.id === id ? oldClient! : c), // Возвращаем старый объект целиком
          ),
          error: err instanceof Error ? err.message : "Ошибка обновления",
        }));
      }
      return false;
    } finally {
      // 5. В любом случае выключаем крутилку
      set({ loading: false });
    }
  },
}));
