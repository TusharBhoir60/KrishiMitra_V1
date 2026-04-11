export const StatusProgress = ({ currentStatus, deliveryMethod }) => {
  const getSteps = () => {
    if (deliveryMethod === 'platform_transporter') {
      return ['pending', 'accepted', 'scheduled', 'in_transit', 'delivered', 'completed'];
    }
    return ['pending', 'accepted', 'dispatched', 'delivered', 'completed'];
  };

  const steps = getSteps();
  const currentIndex = steps.indexOf(currentStatus) !== -1 ? steps.indexOf(currentStatus) : 0;

  return (
    <div className="w-full my-6">
      <div className="flex items-center w-full">
        {steps.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step} className="flex flex-1 items-center">
              {index > 0 && (
                <div className={`h-1 flex-1 rounded ${isPast || isCurrent ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
              <div className={`relative z-10 h-4 w-4 shrink-0 rounded-full ${isPast ? 'bg-green-500' : isCurrent ? 'bg-amber-400 animate-pulse' : 'bg-gray-300'}`} />
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div
              key={step}
              className={`text-center text-xs font-body leading-tight break-words px-1 ${isPast ? 'text-green-700' : isCurrent ? 'font-bold text-amber-700' : 'text-gray-500'}`}
            >
              {step.replace(/_/g, ' ')}
            </div>
          );
        })}
      </div>
    </div>
  );
};
