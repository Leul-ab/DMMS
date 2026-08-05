import { Star } from 'lucide-react';
import { useState } from 'react';

type StarRatingProps = {
    value: number;
    onChange?: (value: number) => void;
    readOnly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
};

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
};

export function StarRating({
    value,
    onChange,
    readOnly = false,
    size = 'md',
    className = '',
}: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState(0);

    const displayValue = hoverValue || value;

    const handleClick = (rating: number) => {
        if (readOnly || !onChange) return;
        onChange(rating);
    };

    return (
        <div
            className={`flex items-center gap-1 ${className}`}
            role={readOnly ? 'img' : 'radiogroup'}
            aria-label={readOnly ? `Rating: ${value} out of 5` : 'Star rating'}
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= displayValue;

                return (
                    <button
                        key={star}
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => !readOnly && setHoverValue(star)}
                        onMouseLeave={() => !readOnly && setHoverValue(0)}
                        className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-transform duration-150 ${
                            !readOnly ? 'hover:scale-125 active:scale-95' : ''
                        }`}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        aria-checked={readOnly ? undefined : star === value}
                        role={readOnly ? undefined : 'radio'}
                    >
                        <Star
                            className={`${sizeClasses[size]} transition-colors duration-150 ${
                                isFilled
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-stone-200 text-stone-200'
                            }`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
