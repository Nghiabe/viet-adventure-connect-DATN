// src/components/ai-planner/ExpandableTourCard.tsx
import React, { useState } from 'react';
import {
    CheckCircle, ChevronDown, ChevronUp, Clock, MapPin,
    Star, Check, X, Lightbulb, Calendar, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TourImage {
    url: string;
    thumbnail?: string;
    caption?: string;
}

interface TourSchedule {
    morning?: string;
    afternoon?: string;
    evening?: string;
}

interface Tour {
    tour_id: string;
    title: string;
    description?: string;
    price: number;
    duration: string;
    match_score?: number;
    fit_reason?: string;
    route?: string;
    highlights?: string[];
    schedule?: TourSchedule;
    includes?: string[];
    excludes?: string[];
    tips?: string;
    category?: string;
    itinerary_preview?: string;
    images?: TourImage[];
    url?: string;
}

interface ExpandableTourCardProps {
    tour: Tour;
    isSelected: boolean;
    onSelect: (tourId: string) => void;
}

const categoryIcons: Record<string, string> = {
    tham_quan: '🏛️',
    am_thuc: '🍜',
    van_hoa: '🎭',
    trai_nghiem: '🎯',
    phieu_luu: '🏔️',
};

const categoryLabels: Record<string, string> = {
    tham_quan: 'Tham quan',
    am_thuc: 'Ẩm thực',
    van_hoa: 'Văn hóa',
    trai_nghiem: 'Trải nghiệm',
    phieu_luu: 'Phiêu lưu',
};

export const ExpandableTourCard: React.FC<ExpandableTourCardProps> = ({
    tour,
    isSelected,
    onSelect,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleSelect = () => {
        onSelect(tour.tour_id);
    };

    // Get first image if available
    const mainImage = tour.images?.[0];

    return (
        <div
            className={cn(
                "rounded-xl border-2 transition-all duration-300 overflow-hidden relative bg-white",
                isSelected
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : "border-gray-200 hover:border-primary/50 hover:shadow-md"
            )}
        >
            {/* Selection badge */}
            {isSelected && (
                <div className="absolute top-3 right-3 z-10 bg-primary text-white rounded-full p-1.5 shadow-lg">
                    <CheckCircle className="h-4 w-4" />
                </div>
            )}

            {/* Main card content - always visible */}
            <div
                className="p-4 cursor-pointer"
                onClick={handleSelect}
            >
                <div className="flex gap-4">
                    {/* Image */}
                    <div className="h-28 w-28 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                        {mainImage?.url ? (
                            <img
                                src={mainImage.url}
                                alt={tour.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '';
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                                {categoryIcons[tour.category || 'tham_quan'] || '🏛️'}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight">
                                {tour.title}
                            </h4>
                        </div>

                        {/* Route with arrows */}
                        {tour.route && (
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1 line-clamp-1">
                                <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <span className="truncate">{tour.route}</span>
                            </p>
                        )}

                        {/* Highlights badges */}
                        {tour.highlights && tour.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {tour.highlights.slice(0, 3).map((h, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs bg-primary/5 text-primary border-primary/20"
                                    >
                                        {h}
                                    </Badge>
                                ))}
                                {tour.highlights.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{tour.highlights.length - 3}
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Footer: Duration, Price, Expand button */}
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    <Clock className="h-3.5 w-3.5" />
                                    {tour.duration}
                                </span>
                                {tour.category && (
                                    <span className="text-xs text-gray-500">
                                        {categoryLabels[tour.category] || tour.category}
                                    </span>
                                )}
                            </div>
                            <span className="font-bold text-lg text-primary">
                                {new Intl.NumberFormat('vi-VN').format(tour.price)}₫
                            </span>
                        </div>
                    </div>
                </div>

                {/* Expand button */}
                <button
                    onClick={handleToggleExpand}
                    className="w-full mt-3 flex items-center justify-center gap-1 text-sm text-primary hover:bg-primary/5 py-2 rounded-lg transition-colors"
                >
                    {isExpanded ? (
                        <>
                            Thu gọn <ChevronUp className="h-4 w-4" />
                        </>
                    ) : (
                        <>
                            Xem chi tiết <ChevronDown className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Description */}
                    {tour.description && (
                        <p className="text-sm text-gray-700">{tour.description}</p>
                    )}

                    {/* Images gallery */}
                    {tour.images && tour.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {tour.images.map((img, idx) => (
                                <div key={idx} className="flex-shrink-0 relative group">
                                    <img
                                        src={img.url}
                                        alt={img.caption || tour.title}
                                        className="h-20 w-28 object-cover rounded-lg border shadow-sm"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Schedule */}
                    {tour.schedule && Object.keys(tour.schedule).length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Calendar className="h-4 w-4 text-primary" />
                                Lịch trình chi tiết
                            </div>
                            <div className="space-y-1.5 text-sm text-gray-600">
                                {tour.schedule.morning && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Sáng</span>
                                        <span>{tour.schedule.morning}</span>
                                    </div>
                                )}
                                {tour.schedule.afternoon && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-xs font-medium bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Chiều</span>
                                        <span>{tour.schedule.afternoon}</span>
                                    </div>
                                )}
                                {tour.schedule.evening && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-xs font-medium bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Tối</span>
                                        <span>{tour.schedule.evening}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Includes / Excludes */}
                    <div className="grid grid-cols-2 gap-3">
                        {tour.includes && tour.includes.length > 0 && (
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bao gồm</span>
                                <ul className="space-y-1">
                                    {tour.includes.slice(0, 4).map((item, idx) => (
                                        <li key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                                            <Check className="h-3 w-3 text-green-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {tour.excludes && tour.excludes.length > 0 && (
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Không bao gồm</span>
                                <ul className="space-y-1">
                                    {tour.excludes.slice(0, 4).map((item, idx) => (
                                        <li key={idx} className="text-xs text-gray-400 flex items-center gap-1">
                                            <X className="h-3 w-3 text-red-400" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    {tour.tips && (
                        <div className="flex items-start gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-xs font-semibold text-yellow-800">Mẹo hay</span>
                                <p className="text-xs text-yellow-700 mt-0.5">{tour.tips}</p>
                            </div>
                        </div>
                    )}

                    {/* Match score & Why recommended */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            <span>Độ phù hợp: {Math.round((tour.match_score || 0) * 100)}%</span>
                        </div>
                        {tour.url && (
                            <a
                                href={tour.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline hover:text-primary/80"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Xem nguồn gốc
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpandableTourCard;
