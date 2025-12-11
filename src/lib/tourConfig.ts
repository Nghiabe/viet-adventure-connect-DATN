/**
 * Shared configuration for tour categories.
 * Used across ToursSearch, ExperienceDetail, TourCard, etc.
 */
import { Landmark, Mountain, Utensils, Camera, Sparkles } from 'lucide-react';
import React from 'react';

export interface CategoryInfo {
    label: string;
    icon: React.ReactNode;
    gradient: string;
    color: string;
    bgLight: string;
}

/**
 * Category configuration with icons, gradients, and colors.
 * Keys match the `category` field from AI service tour data.
 */
export const categoryConfig: Record<string, CategoryInfo> = {
    tham_quan: {
        label: 'Tham quan',
        icon: React.createElement(Landmark, { className: 'w-4 h-4' }),
        gradient: 'from-blue-500 to-cyan-400',
        color: 'bg-blue-500',
        bgLight: 'bg-blue-100 text-blue-700'
    },
    phieu_luu: {
        label: 'Phiêu lưu',
        icon: React.createElement(Mountain, { className: 'w-4 h-4' }),
        gradient: 'from-orange-500 to-amber-400',
        color: 'bg-orange-500',
        bgLight: 'bg-orange-100 text-orange-700'
    },
    am_thuc: {
        label: 'Ẩm thực',
        icon: React.createElement(Utensils, { className: 'w-4 h-4' }),
        gradient: 'from-green-500 to-emerald-400',
        color: 'bg-green-500',
        bgLight: 'bg-green-100 text-green-700'
    },
    van_hoa: {
        label: 'Văn hóa',
        icon: React.createElement(Camera, { className: 'w-4 h-4' }),
        gradient: 'from-purple-500 to-violet-400',
        color: 'bg-purple-500',
        bgLight: 'bg-purple-100 text-purple-700'
    },
    trai_nghiem: {
        label: 'Trải nghiệm',
        icon: React.createElement(Sparkles, { className: 'w-4 h-4' }),
        gradient: 'from-pink-500 to-rose-400',
        color: 'bg-pink-500',
        bgLight: 'bg-pink-100 text-pink-700'
    }
};

/**
 * Get category info by key, with fallback to 'tham_quan'.
 */
export const getCategoryInfo = (category: string): CategoryInfo => {
    return categoryConfig[category] || categoryConfig.tham_quan;
};

/**
 * Get all categories as an array for filter UI.
 */
export const categoriesArray = Object.entries(categoryConfig).map(([id, config]) => ({
    id,
    ...config
}));

/**
 * Default category key.
 */
export const DEFAULT_CATEGORY = 'tham_quan';
