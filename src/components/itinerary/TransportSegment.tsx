// src/components/itinerary/TransportSegment.tsx
import React from 'react';
import { Car, Footprints, Bike, Bus, Navigation } from 'lucide-react';

interface TransportData {
    from: string;
    to: string;
    method: string;
    distance_km?: number;
    duration_minutes?: number;
    alternative?: string;
}

interface TransportSegmentProps {
    time: string;
    transport: TransportData;
    cost: number;
}

const getTransportIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('bộ') || m.includes('walk')) {
        return <Footprints className="h-4 w-4" />;
    }
    if (m.includes('xe máy') || m.includes('motor')) {
        return <Bike className="h-4 w-4" />;
    }
    if (m.includes('bus') || m.includes('xe buýt')) {
        return <Bus className="h-4 w-4" />;
    }
    return <Car className="h-4 w-4" />;
};

const formatCost = (cost: number) => {
    if (cost === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(cost) + '₫';
};

export const TransportSegment: React.FC<TransportSegmentProps> = ({
    time,
    transport,
    cost
}) => {
    const { from, to, method, distance_km, duration_minutes, alternative } = transport;

    return (
        <div className="relative my-4">
            {/* Vertical line connector */}
            <div className="absolute left-[18px] -top-4 w-0.5 h-4 bg-orange-200" />
            <div className="absolute left-[18px] -bottom-4 w-0.5 h-4 bg-orange-200" />

            <div className="flex items-center gap-4 py-3 px-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                {/* Icon */}
                <div className="bg-slate-200 p-2 rounded-full">
                    {getTransportIcon(method)}
                </div>

                {/* Main info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">{from}</span>
                        <Navigation className="h-3 w-3 text-orange-500 rotate-90" />
                        <span className="font-medium text-gray-700">{to}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="font-medium text-gray-600">{method}</span>
                        {distance_km && (
                            <span>• {distance_km} km</span>
                        )}
                        {duration_minutes && (
                            <span>• ~{duration_minutes} phút</span>
                        )}
                    </div>
                </div>

                {/* Time & Cost */}
                <div className="text-right">
                    <p className="text-xs text-gray-500">{time}</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCost(cost)}</p>
                </div>
            </div>

            {/* Alternative */}
            {alternative && (
                <p className="text-xs text-gray-400 mt-1 ml-12">
                    💡 Thay thế: {alternative}
                </p>
            )}
        </div>
    );
};

export default TransportSegment;
