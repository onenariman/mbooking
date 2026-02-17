import ReceptionComponents from "@/components/Reception";

const ReceptionPage = () => {
  return (
    <div className="flex flex-col gap-y-5 py-4 min-h-[125dvh] w-full mx-auto">
      <h1 className="text-2xl font-bold">Мои записи</h1>
      <ReceptionComponents />
    </div>
  );
};

export default ReceptionPage;
