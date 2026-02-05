"use client";

import AddClient from "@/components/Client/AddClient";
import List from "@/components/Client/List";

// import dynamic from "next/dynamic";

// const AddClient = dynamic(() => import("@/components/Client/AddClient"), {
//   ssr: false,
// });

// const List = dynamic(() => import("@/components/Client/List"), { ssr: false });

export default function ClientPage() {
  return (
    <div className="flex flex-col gap-y-5 py-4 min-h-screen">
      <h1 className="text-2xl font-bold">Мои клиенты</h1>
      <AddClient />
      <List />
    </div>
  );
}
