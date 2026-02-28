"use client";

import Client from "@/components/Client";

export default function ClientPage() {
  return (
    <div className="flex flex-col gap-y-5 py-4 min-h-screen">
      <h1 className="text-2xl font-bold">Мои клиенты</h1>
      <Client />
    </div>
  );
}
