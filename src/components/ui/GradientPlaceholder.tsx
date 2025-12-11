/**
 * Gradient placeholder for tours without images.
 * Shows category icon with beautiful gradient background.
 */
import React from 'react';
import { getCategoryInfo, DEFAULT_CATEGORY } from '@/lib/tourConfig';

interface GradientPlaceholderProps {
    /** Tour category key (e.g., 'am_thuc', 'tham_quan') */
    category?: string;
    /** Optional title to display */
    title?: string;
    /** Optional children to render */
    children?: React.ReactNode;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Beautiful gradient placeholder for tours without images.
 * Uses category-specific colors and icons.
 */
export function GradientPlaceholder({
    category = DEFAULT_CATEGORY,
    title,
    children,
    size = 'md'
}: GradientPlaceholderProps) {
    const config = getCategoryInfo(category);

    const sizeClasses = {
        sm: { icon: 'w-10 h-10', text: 'text-xs max-w-[100px]' },
        md: { icon: 'w-14 h-14', text: 'text-xs max-w-[150px]' },
        lg: { icon: 'w-20 h-20', text: 'text-sm max-w-[200px]' }
    };

    const sizes = sizeClasses[size];

    return (
        <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center relative overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/20" />

            {/* Content */}
            <div className="relative z-10 text-center text-white p-4">
                <div className="mb-2 flex justify-center">
                    <div className={`${sizes.icon} rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm`}>
                        {config.icon}
                    </div>
                </div>
                {children || (
                    title && <p className={`font-medium opacity-90 line-clamp-2 ${sizes.text}`}>{title}</p>
                )}
            </div>
        </div>
    );
}

export default GradientPlaceholder;
