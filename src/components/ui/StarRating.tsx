import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StarRatingProps {
    value: number;
    onChange?: (value: number) => void;
    readonly?: boolean;
    className?: string;
    size?: number;
}

export function StarRating({ value, onChange, readonly = false, className, size = 20 }: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState(0);

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    className={cn(
                        "transition-all duration-200 focus:outline-none",
                        readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
                    )}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => !readonly && setHoverValue(star)}
                    onMouseLeave={() => !readonly && setHoverValue(0)}
                >
                    <Star
                        size={size}
                        className={cn(
                            "transition-colors",
                            (hoverValue || value) >= star
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-transparent text-gray-300"
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
