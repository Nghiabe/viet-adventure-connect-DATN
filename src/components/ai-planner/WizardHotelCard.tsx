// src/components/ai-planner/WizardHotelCard.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { IHotel } from '@/types';
import {
    CheckCircle,
    Star,
    MapPin,
    Wifi,
    Coffee,
    Car,
    Waves,
    ExternalLink,
    BadgeCheck,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Navigation,
    Users,
    CreditCard,
    Building2,
    Globe,
    Bed,
    Utensils,
    Dumbbell,
    Wind
} from 'lucide-react';

interface WizardHotelCardProps {
    hotel: IHotel;
    isSelected: boolean;
    onSelect: () => void;
}

// Map amenity names to icons
const amenityIconMap: Record<string, React.ReactNode> = {
    'WiFi': <Wifi className="w-3.5 h-3.5" />,
    'wifi': <Wifi className="w-3.5 h-3.5" />,
    'Free WiFi': <Wifi className="w-3.5 h-3.5" />,
    'Hồ bơi': <Waves className="w-3.5 h-3.5" />,
    'Pool': <Waves className="w-3.5 h-3.5" />,
    'Swimming Pool': <Waves className="w-3.5 h-3.5" />,
    'Đậu xe': <Car className="w-3.5 h-3.5" />,
    'Đậu xe miễn phí': <Car className="w-3.5 h-3.5" />,
    'Parking': <Car className="w-3.5 h-3.5" />,
    'Free Parking': <Car className="w-3.5 h-3.5" />,
    'Bữa sáng': <Coffee className="w-3.5 h-3.5" />,
    'Breakfast': <Coffee className="w-3.5 h-3.5" />,
    'Restaurant': <Utensils className="w-3.5 h-3.5" />,
    'Nhà hàng': <Utensils className="w-3.5 h-3.5" />,
    'Gym': <Dumbbell className="w-3.5 h-3.5" />,
    'Fitness': <Dumbbell className="w-3.5 h-3.5" />,
    'Điều hòa': <Wind className="w-3.5 h-3.5" />,
    'Air Conditioning': <Wind className="w-3.5 h-3.5" />,
    'Hủy miễn phí': <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
    'Free Cancellation': <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
};

const getAmenityIcon = (amenity: string) => {
    // Try exact match first
    if (amenityIconMap[amenity]) return amenityIconMap[amenity];

    // Try partial match
    const lowerAmenity = amenity.toLowerCase();
    for (const [key, icon] of Object.entries(amenityIconMap)) {
        if (lowerAmenity.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerAmenity)) {
            return icon;
        }
    }

    return <BadgeCheck className="w-3.5 h-3.5" />;
};

const formatPrice = (price: number | null | undefined): string => {
    if (price == null) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
};

// NOTE: StarRating component removed - using inline rating badge instead

// Hotel star class component (1-5 stars)
const HotelStars: React.FC<{ stars: number | null }> = ({ stars }) => {
    if (!stars) return null;

    return (
        <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-full">
            {Array.from({ length: stars }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
            ))}
            <span className="text-xs text-amber-700 ml-1 font-medium">{stars}★</span>
        </div>
    );
};

export const WizardHotelCard: React.FC<WizardHotelCardProps> = ({ hotel, isSelected, onSelect }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Extract data with fallbacks
    const name = hotel.name || 'Khách sạn';
    const rating = hotel.rating ?? null;
    const stars = hotel.stars ?? null;
    const pricePerNight = hotel.price_per_night;
    const priceDisplay = hotel.price_display || (pricePerNight ? formatPrice(pricePerNight) + '/đêm' : null);
    const totalPrice = hotel.total_price;
    const location = hotel.location || hotel.city || 'Việt Nam';
    const city = hotel.city;
    const distance = hotel.distance_to_center;
    const amenities = hotel.amenities || [];
    const whyRecommended = hotel.why_recommended;
    const bookingUrl = hotel.booking_url;
    const images = hotel.images || [];
    const mainImage = images[0]?.url || hotel.imageUrl;
    const coordinates = hotel.coordinates;
    const description = hotel.description;
    const hotelId = hotel.hotel_id;
    const reviewCount = hotel.reviewCount;

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't toggle if clicking on expand button or links
        if ((e.target as HTMLElement).closest('.no-card-click')) return;
        onSelect();
    };

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                "group cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden relative",
                "hover:shadow-xl",
                isSelected
                    ? "border-emerald-500 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 shadow-lg shadow-emerald-100/50"
                    : "border-gray-100 bg-white hover:border-emerald-200 hover:bg-gray-50/30"
            )}
        >
            {/* Selected Badge */}
            {isSelected && (
                <div className="absolute top-4 right-4 z-20 bg-emerald-500 text-white rounded-full p-2 shadow-lg animate-in zoom-in duration-200">
                    <CheckCircle className="h-5 w-5" />
                </div>
            )}

            {/* Main Content */}
            <div className="flex">
                {/* Image Section */}
                <div className="relative w-44 min-h-[180px] shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        // Beautiful placeholder when no image
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-2">
                                <Building2 className="w-8 h-8 text-slate-300" />
                            </div>
                            <span className="text-xs text-slate-400 text-center font-medium">{name.slice(0, 20)}...</span>
                        </div>
                    )}

                    {/* Star Rating Overlay */}
                    {stars && (
                        <div className="absolute top-3 left-3">
                            <HotelStars stars={stars} />
                        </div>
                    )}

                    {/* Distance Badge */}
                    {distance && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                            <Navigation className="w-3 h-3" />
                            {distance}
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4 flex flex-col min-h-[180px]">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                            <h4 className={cn(
                                "font-bold text-lg leading-tight line-clamp-2 transition-colors",
                                isSelected ? "text-emerald-700" : "text-gray-900 group-hover:text-emerald-600"
                            )}>
                                {name}
                            </h4>

                            {/* Location */}
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                <span className="truncate">{location}</span>
                            </div>
                        </div>

                        {/* Rating Badge */}
                        {rating !== null && (
                            <div className={cn(
                                "shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-center",
                                rating >= 4.5 ? "bg-emerald-100" :
                                    rating >= 4.0 ? "bg-blue-100" :
                                        rating >= 3.0 ? "bg-amber-100" :
                                            "bg-gray-100"
                            )}>
                                <span className={cn(
                                    "text-lg font-bold",
                                    rating >= 4.5 ? "text-emerald-700" :
                                        rating >= 4.0 ? "text-blue-700" :
                                            rating >= 3.0 ? "text-amber-700" :
                                                "text-gray-700"
                                )}>
                                    {rating.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                    {rating >= 4.5 ? 'Xuất sắc' : rating >= 4.0 ? 'Rất tốt' : rating >= 3.0 ? 'Tốt' : 'Đánh giá'}
                                </span>
                                {reviewCount && (
                                    <span className="text-[10px] text-gray-400 mt-0.5">
                                        {reviewCount.toLocaleString()} đánh giá
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Why Recommended */}
                    {whyRecommended && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg mb-2 w-fit">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            <span className="font-medium">{whyRecommended}</span>
                        </div>
                    )}

                    {/* Amenities */}
                    {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {amenities.slice(0, isExpanded ? 8 : 4).map((amenity, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg"
                                >
                                    {getAmenityIcon(amenity)}
                                    <span className="max-w-[80px] truncate">{amenity}</span>
                                </span>
                            ))}
                            {!isExpanded && amenities.length > 4 && (
                                <span className="text-xs text-gray-400 self-center">
                                    +{amenities.length - 4} tiện ích
                                </span>
                            )}
                        </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Price & Actions */}
                    <div className="flex items-end justify-between pt-2 border-t border-gray-100">
                        {/* Price */}
                        <div className="flex flex-col">
                            {priceDisplay ? (
                                <>
                                    <span className={cn(
                                        "text-xl font-bold",
                                        isSelected ? "text-emerald-600" : "text-gray-900"
                                    )}>
                                        {priceDisplay}
                                    </span>
                                    {totalPrice && totalPrice !== pricePerNight && (
                                        <span className="text-xs text-gray-500">
                                            Tổng cộng: {formatPrice(totalPrice)}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-lg font-semibold text-gray-500">Liên hệ</span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 no-card-click">
                            {/* Expand Button */}
                            <button
                                onClick={toggleExpand}
                                className="flex items-center gap-1 text-xs font-medium text-gray-600 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                {isExpanded ? (
                                    <>Thu gọn <ChevronUp className="w-3 h-3" /></>
                                ) : (
                                    <>Xem thêm <ChevronDown className="w-3 h-3" /></>
                                )}
                            </button>

                            {/* Booking Link */}
                            {bookingUrl && (
                                <a
                                    href={bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all",
                                        "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    )}
                                >
                                    Đặt phòng
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 animate-in slide-in-from-top-2 duration-200 no-card-click">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Left Column - Details */}
                        <div className="space-y-3">
                            <h5 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                Thông tin chi tiết
                            </h5>

                            {/* Address */}
                            <div className="text-sm space-y-1">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-gray-600">{location}</span>
                                        {city && city !== location && (
                                            <span className="text-gray-400 block text-xs">{city}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Coordinates */}
                            {coordinates && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Globe className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500">
                                        {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                                    </span>
                                    <a
                                        href={`https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Xem bản đồ
                                    </a>
                                </div>
                            )}

                            {/* Hotel ID */}
                            {hotelId && (
                                <div className="flex items-center gap-2 text-sm">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500 text-xs">Mã KS: {hotelId}</span>
                                </div>
                            )}

                            {/* Description */}
                            {description && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                                </div>
                            )}
                        </div>

                        {/* Right Column - All Amenities */}
                        <div className="space-y-3">
                            <h5 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                <Bed className="w-4 h-4 text-gray-400" />
                                Tiện ích ({amenities.length})
                            </h5>

                            <div className="flex flex-wrap gap-2">
                                {amenities.map((amenity, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-sm"
                                    >
                                        {getAmenityIcon(amenity)}
                                        {amenity}
                                    </span>
                                ))}
                                {amenities.length === 0 && (
                                    <span className="text-sm text-gray-400 italic">Chưa có thông tin</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Price Summary */}
                    {(pricePerNight || totalPrice) && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm">
                                    {pricePerNight && (
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">Giá phòng:</span>
                                            <span className="font-semibold text-gray-800">{formatPrice(pricePerNight)}/đêm</span>
                                        </div>
                                    )}
                                    {totalPrice && totalPrice !== pricePerNight && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">Tổng tiền:</span>
                                            <span className="font-bold text-lg text-emerald-600">{formatPrice(totalPrice)}</span>
                                        </div>
                                    )}
                                </div>

                                {bookingUrl && (
                                    <a
                                        href={bookingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
                                    >
                                        Đặt phòng ngay
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Selection Glow Effect */}
            {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 pointer-events-none" />
            )}
        </div>
    );
};

export default WizardHotelCard;
