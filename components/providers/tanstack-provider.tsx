"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface TanstackProviderProps {
  children: React.ReactNode;
}

export const TanstackProvider = ({ children }: TanstackProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity, // данные считаем вечными
            refetchOnWindowFocus: false, // фокус окна игнорируем
            retry: 0, // не повторяем запрос при ошибке
          },
          mutations: {
            retry: 0, // мутации не повторяются, чтобы не делать лишние изменения
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
