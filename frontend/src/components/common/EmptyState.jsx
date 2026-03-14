export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-gray-100 border-dashed w-full h-full min-h-[300px]">
      {Icon && (
        <div className="w-16 h-16 bg-farm-pale text-farm-green rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="font-display text-xl text-farm-dark mb-2">{title}</h3>
      <p className="font-body text-gray-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
};
