import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Loader2 className={`animate-spin text-farm-green ${sizeMap[size]}`} />
    </div>
  );
};
