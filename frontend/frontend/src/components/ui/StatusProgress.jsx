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
    <div className="flex items-center w-full my-6">
      {steps.map((step, index) => {
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={step} className={`flex-1 flex items-center relative ${index === 0 ? 'flex-none' : ''}`}>
            {index > 0 && (
              <div className={`h-1 flex-1 mx-2 rounded ${isPast || isCurrent ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
            <div className={`w-4 h-4 rounded-full z-10 ${isPast ? 'bg-green-500' : isCurrent ? 'bg-amber-400 animate-pulse' : 'bg-gray-300'}`} />
            <span className={`absolute -bottom-6 text-xs font-body transform -translate-x-1/2 whitespace-nowrap 
              ${isPast ? 'text-green-700' : isCurrent ? 'font-bold text-amber-700' : 'text-gray-500'}
              ${index === 0 ? 'left-2' : ''}
              ${index === steps.length - 1 ? 'right-0 translate-x-2' : ''}
            `}>
              {step.replace('_', ' ')}
            </span>
          </div>
        );
      })}
    </div>
  );
};
