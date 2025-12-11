// src/components/hotels/HotelCard.tsx
import React from 'react';
import type { IHotel } from '@/types'; // hoặc `any` nếu bạn chưa cập nhật types
import { ResilientImage } from '@/components/ui/ResilientImage';
import { Star, MapPin /*, ExternalLink */ } from 'lucide-react'; // không import Link ở đây
import { Link } from 'react-router-dom'; // <-- đúng import cho routing
import { Button } from '@/components/ui/button';

type HotelCardProps = {
  hotel: IHotel | any;
};

const formatNumber = (n: number | null | undefined, locale = 'vi-VN') => {
  if (n == null || Number.isNaN(n)) return '';
  return Number(n).toLocaleString(locale);
};

const HotelCard: React.FC<HotelCardProps> = ({ hotel }) => {
  const name = hotel?.name ?? 'Khách sạn';
  const imageUrl = hotel?.imageUrl ?? hotel?.raw?.image_url ?? '/images/hotel-fallback.jpg';
  const location = hotel?.location ?? hotel?.raw?.display_location ?? 'Địa điểm chưa rõ';

  // rating (0-5) hoặc convert nếu backend trả 0-10
  let rating: number | null = null;
  if (typeof hotel?.rating === 'number') rating = hotel.rating;
  else if (typeof hotel?.raw?.rating?.score === 'number') {
    const s = hotel.raw.rating.score;
    rating = s > 5 ? Number((s / 2).toFixed(1)) : Number(s.toFixed(1));
  }

  const reviewCount: number = (hotel?.reviewCount ?? hotel?.raw?.rating?.review_count ?? 0) as number;

  // price logic: ưu tiên priceVndDisplay -> finalPriceDisplay -> priceDisplay -> priceNumber
  const priceVndDisplay = hotel?.priceVndDisplay ?? hotel?.finalPriceDisplay ?? null;
  const priceDisplay = hotel?.priceDisplay ?? null;
  const priceNumber = hotel?.priceNumber ?? null;
  const priceVndNumber = hotel?.priceVndNumber ?? null;

  let priceText = 'Liên hệ';
  if (priceVndDisplay) priceText = priceVndDisplay;
  else if (priceDisplay) priceText = String(priceDisplay);
  else if (priceVndNumber != null && !Number.isNaN(Number(priceVndNumber))) {
    priceText = `${formatNumber(Number(priceVndNumber), 'vi-VN')} ₫`;
  } else if (priceNumber != null && !Number.isNaN(Number(priceNumber))) {
    // nếu raw currency là USD, hiển thị USD; nếu không, hiển thị theo locale VN
    const rawCurrency = hotel?.raw?.price?.currency ?? hotel?.raw?.currency ?? '';
    if (rawCurrency && String(rawCurrency).toUpperCase() === 'USD') {
      priceText = `${formatNumber(Number(priceNumber), 'en-US')} USD`;
    } else {
      priceText = `${formatNumber(Number(priceNumber), 'vi-VN')}`;
    }
  }

  const amenities: string[] = Array.isArray(hotel?.amenities) ? hotel.amenities : [];

  return (
    <article className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className="relative">
        <ResilientImage
          src={imageUrl}
          alt={name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 rounded-none"
        />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">
                {rating !== null ? Number(rating).toFixed(1) : 'Chưa có'}
              </span>
            </div>
            <span className="text-muted-foreground text-sm">({formatNumber(reviewCount)} đánh giá)</span>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-1 line-clamp-2">{name}</h3>

        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{location}</span>
        </div>

        {amenities.length > 0 && (
          <div className="space-y-1 mb-4">
            <div className="flex flex-wrap gap-2">
              {amenities.slice(0, 5).map(a => (
                <span key={a} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                  {a}
                </span>
              ))}
              {amenities.length > 5 && <span className="text-xs text-muted-foreground">+{amenities.length - 5}</span>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">
              {priceText}
            </span>
          </div>

          {/* DÙNG react-router Link ĐÚNG */}
          <Link to={`/hotels/${encodeURIComponent(hotel.id)}`} state={{ hotel }}>
            <Button size="sm" variant="default">Xem chi tiết</Button>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default HotelCard;
