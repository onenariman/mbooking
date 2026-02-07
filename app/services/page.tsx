import Service from "@/components/Service";

const ServicesPage = () => {
  return (
    <div className="flex flex-col gap-y-5 py-4 min-h-screen">
      <h1 className="text-2xl font-bold">Мои услуги</h1>
      <Service />
    </div>
  );
};

export default ServicesPage;
