import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, Clock, DollarSign, Star, ExternalLink, Ticket } from 'lucide-react';

interface TourData {
    tour_id: string;
    title: string;
    description?: string;
    price?: number;
    duration?: string;
    image?: string;
    rating?: number;
    location?: string;
    booking_url?: string;
}

interface SelectedToursSectionProps {
    tours: TourData[];
}

export const SelectedToursSection: React.FC<SelectedToursSectionProps> = ({ tours }) => {
    if (!tours || tours.length === 0) {
        return null;
    }

    const formatPrice = (price?: number) => {
        if (!price) return 'Liên hệ';
        return price.toLocaleString('vi-VN') + ' ₫';
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Ticket className="h-5 w-5 text-orange-500" />
                    Tour & Trải nghiệm đã chọn
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {tours.map((tour, index) => (
                    <div key={tour.tour_id || index} className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        {/* Image */}
                        <div className="h-32 overflow-hidden relative">
                            <img
                                src={tour.image || '/placeholder-tour.jpg'}
                                alt={tour.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => (e.target as HTMLImageElement).src = '/placeholder-tour.jpg'}
                            />
                            {tour.rating && (
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    {tour.rating}
                                </div>
                            )}
                        </div>

                        <div className="p-3">
                            <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm" title={tour.title}>
                                {tour.title}
                            </h4>

                            <div className="flex flex-col gap-1.5 mb-3">
                                {tour.duration && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <Clock className="w-3 h-3" />
                                        <span>{tour.duration}</span>
                                    </div>
                                )}
                                {tour.price && (
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                                        <DollarSign className="w-3 h-3" />
                                        <span>{formatPrice(tour.price)}</span>
                                    </div>
                                )}
                            </div>

                            {tour.booking_url && (
                                <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => window.open(tour.booking_url, '_blank')}>
                                    Xem chi tiết <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
