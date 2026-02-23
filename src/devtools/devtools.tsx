"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const Devtools = () => {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return <ReactQueryDevtools initialIsOpen={true} />;
};
