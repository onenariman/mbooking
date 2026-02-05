"use client";
import dynamic from "next/dynamic";

const AddService = dynamic(() => import("@/components/Service/AddService"), {
  ssr: false,
});

const ServicesPage = () => {
  return (
    <div className="flex flex-col gap-y-5 py-4 min-h-screen">
      <h1 className="text-2xl font-bold">Мои услуги</h1>
      <AddService />
    </div>
  );
};

export default ServicesPage;
