// components/providers/Devtools.tsx
"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const Devtools = () => {
  return (
    <>
      <ReactQueryDevtools initialIsOpen={true} />
    </>
  );
};
