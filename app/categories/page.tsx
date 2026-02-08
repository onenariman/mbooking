import Category from "@/components/Category";

const CategoriesPage = () => {
  return (
    <div className="flex flex-col gap-y-5 py-4 min-h-screen">
      <h1 className="text-2xl font-bold">Мои категории</h1>
      <Category />
    </div>
  );
};

export default CategoriesPage;
