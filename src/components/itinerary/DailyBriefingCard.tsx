// src/components/itinerary/DailyBriefingCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, CloudRain, Cloud, Thermometer, Shirt, Backpack, AlertCircle } from 'lucide-react';

interface DailyBriefing {
    weather: {
        temp: number;
        condition: string;
        humidity: number;
        icon: string;
    };
    dress_code: string;
    must_bring: string[];
    special_notes?: string;
}

interface StartPoint {
    name: string;
    address: string;
    image?: string;
}

interface DailyBriefingCardProps {
    day: number;
    date: string;
    briefing: DailyBriefing | null;
    startPoint?: StartPoint | null;
}

const getWeatherIcon = (iconEmoji: string) => {
    if (iconEmoji.includes('☀') || iconEmoji.includes('🌞') || iconEmoji.includes('🔥')) {
        return <Sun className="h-6 w-6 text-yellow-500" />;
    }
    if (iconEmoji.includes('🌧') || iconEmoji.includes('⛈')) {
        return <CloudRain className="h-6 w-6 text-blue-500" />;
    }
    return <Cloud className="h-6 w-6 text-gray-500" />;
};

export const DailyBriefingCard: React.FC<DailyBriefingCardProps> = ({
    day,
    date,
    briefing,
    startPoint
}) => {
    if (!briefing) return null;

    const weather = briefing.weather || {};

    return (
        <Card className="mb-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        📋 Chuẩn bị Ngày {day}
                        <Badge variant="outline" className="text-xs font-normal">
                            {date}
                        </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
                        {getWeatherIcon(weather.icon || '☀️')}
                        <span className="font-bold text-gray-900">{weather.temp || 30}°C</span>
                        <span className="text-sm text-gray-600">{weather.condition || 'Nắng'}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Start Point */}
                    {startPoint && (
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-100">
                            <div className="bg-orange-100 p-2 rounded-full">
                                <Thermometer className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Xuất phát từ</p>
                                <p className="font-semibold text-gray-900">{startPoint.name}</p>
                                {startPoint.address && (
                                    <p className="text-xs text-gray-500">{startPoint.address}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Dress Code */}
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <Shirt className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trang phục</p>
                            <p className="text-sm text-gray-700">{briefing.dress_code || 'Thoải mái'}</p>
                        </div>
                    </div>

                    {/* Must Bring */}
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-100">
                        <div className="bg-green-100 p-2 rounded-full">
                            <Backpack className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mang theo</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {(briefing.must_bring || []).slice(0, 3).map((item, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs bg-green-50 text-green-700">
                                        {item}
                                    </Badge>
                                ))}
                                {(briefing.must_bring || []).length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{briefing.must_bring.length - 3}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Special Notes */}
                {briefing.special_notes && (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">{briefing.special_notes}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DailyBriefingCard;
