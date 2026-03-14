import { Star } from 'lucide-react';

export const StarRating = ({ value, onChange, readonly = false, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          className={`focus:outline-none ${!readonly ? 'hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          <Star
            className={`${sizeClass} ${
              star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};
