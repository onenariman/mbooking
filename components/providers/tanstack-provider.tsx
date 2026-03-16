"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { QUERY_DEFAULTS } from "@/src/lib/queryConfig";

interface TanstackProviderProps {
  children: React.ReactNode;
}

export const TanstackProvider = ({ children }: TanstackProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_DEFAULTS.staleTime,
            refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
            retry: QUERY_DEFAULTS.retry,
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
