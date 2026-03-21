import { useState } from 'react';
import { HiStar } from 'react-icons/hi';

const StarRating = ({ rating = 0, onRate, size = 'md', readonly = false }) => {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <HiStar
            className={`${sizeClasses[size]} ${
              star <= (hover || rating) ? 'text-amber-400' : 'text-gray-200'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;