export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse flex flex-col h-full">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-5 space-y-4 flex-1">
        <div className="flex justify-between">
          <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200"></div>
          <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
        <hr className="border-gray-100 mt-auto" />
        <div className="flex gap-3">
          <div className="h-10 flex-1 bg-gray-200 rounded-lg"></div>
          <div className="h-10 flex-1 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};
