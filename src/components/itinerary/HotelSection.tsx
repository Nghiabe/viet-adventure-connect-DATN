import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hotel, Star, MapPin, ExternalLink, Wifi, Car, Utensils } from 'lucide-react';

interface HotelRecommendation {
  name: string;
  rating?: number;
  price_per_night?: number;
  total_price?: number;
  location?: string;
  address?: string;  // Full address from hotel agent
  image?: string;    // Hotel image URL
  coordinates?: { lat: number; lng: number };
  amenities?: string[];
  booking_url?: string;
  why_recommended?: string;
}

interface HotelSectionProps {
  hotels: HotelRecommendation[];
  selectedHotelIndex?: number;
  onViewOnMap?: (hotel: HotelRecommendation) => void;
}

export const HotelSection: React.FC<HotelSectionProps> = ({
  hotels,
  selectedHotelIndex = 0,
  onViewOnMap
}) => {
  if (!hotels || hotels.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="h-5 w-5 text-orange-500" />
            Gợi ý lưu trú
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chưa có thông tin khách sạn</p>
        </CardContent>
      </Card>
    );
  }

  const selectedHotel = hotels[selectedHotelIndex] || hotels[0];

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet')) return Wifi;
    if (lower.includes('parking') || lower.includes('xe')) return Car;
    if (lower.includes('restaurant') || lower.includes('ăn')) return Utensils;
    return null;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
      />
    ));
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Hotel className="h-5 w-5 text-orange-500" />
          Khách sạn đã chọn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          {/* Hotel Image */}
          {selectedHotel.image && (
            <div className="w-full h-40 rounded-lg overflow-hidden mb-3">
              <img
                src={selectedHotel.image}
                alt={selectedHotel.name}
                className="w-full h-full object-cover"
                onError={(e) => (e.target as HTMLImageElement).src = '/placeholder-hotel.jpg'}
              />
            </div>
          )}

          <h3 className="font-semibold text-lg mb-2">{selectedHotel.name}</h3>

          {selectedHotel.rating && (
            <div className="flex items-center gap-2 mb-2">
              {renderStars(selectedHotel.rating)}
              <span className="text-sm font-medium">{selectedHotel.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Full Address */}
          {(selectedHotel.address || selectedHotel.location) && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{selectedHotel.address || selectedHotel.location}</span>
            </div>
          )}

          {selectedHotel.why_recommended && (
            <p className="text-sm text-muted-foreground mb-3">
              {selectedHotel.why_recommended}
            </p>
          )}
        </div>

        {/* Price */}
        {(selectedHotel.price_per_night || selectedHotel.total_price) && (
          <div className="bg-primary/5 p-3 rounded-lg">
            <div className="flex items-baseline gap-2">
              {selectedHotel.price_per_night && (
                <div>
                  <span className="text-sm text-muted-foreground">Từ </span>
                  <span className="text-lg font-bold text-primary">
                    {selectedHotel.price_per_night.toLocaleString('vi-VN')} ₫
                  </span>
                  <span className="text-sm text-muted-foreground">/đêm</span>
                </div>
              )}
              {selectedHotel.total_price && (
                <div className="ml-auto">
                  <span className="text-sm text-muted-foreground">Tổng: </span>
                  <span className="text-lg font-bold text-primary">
                    {selectedHotel.total_price.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Amenities */}
        {selectedHotel.amenities && selectedHotel.amenities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Tiện ích</h4>
            <div className="flex flex-wrap gap-2">
              {selectedHotel.amenities.slice(0, 8).map((amenity, index) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {Icon && <Icon className="h-3 w-3 mr-1" />}
                    {amenity}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {selectedHotel.coordinates && onViewOnMap && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewOnMap(selectedHotel)}
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Xem trên bản đồ
            </Button>
          )}
          {selectedHotel.booking_url && (
            <Button
              size="sm"
              onClick={() => window.open(selectedHotel.booking_url, '_blank')}
              className="w-full"
            >
              Đặt phòng ngay
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Other options */}
        {hotels.length > 1 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Có {hotels.length - 1} lựa chọn khác
            </p>
            <div className="space-y-2">
              {hotels.slice(0, 3).map((hotel, index) => {
                if (index === selectedHotelIndex) return null;
                return (
                  <div
                    key={index}
                    className="p-2 bg-muted/50 rounded-lg text-sm cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => {
                      // In a real implementation, this would update selected hotel
                      console.log('Select hotel:', index);
                    }}
                  >
                    <div className="font-medium">{hotel.name}</div>
                    {hotel.price_per_night && (
                      <div className="text-xs text-muted-foreground">
                        {hotel.price_per_night.toLocaleString('vi-VN')} ₫/đêm
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



