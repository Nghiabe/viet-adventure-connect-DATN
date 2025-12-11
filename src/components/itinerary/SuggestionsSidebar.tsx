// src/components/itinerary/SuggestionsSidebar.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Car, 
  Hotel, 
  Lightbulb, 
  Star,
  Navigation,
  Info
} from 'lucide-react';

interface Hotel {
  name: string;
  category: string;
  reason: string;
}

interface Suggestions {
  hotels: Hotel[];
  transport: string;
  general_notes: string[];
}

interface SuggestionsSidebarProps {
  suggestions: Suggestions;
}

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'khách sạn 5 sao':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'khách sạn 4 sao':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'khách sạn 3 sao':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'homestay':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'hostel':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const SuggestionsSidebar: React.FC<SuggestionsSidebarProps> = ({ suggestions }) => {
  return (
    <div className="space-y-6">
      {/* Map Placeholder */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-orange-500" />
            Bản đồ hành trình
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center border-2 border-dashed border-orange-300">
            <div className="text-center text-orange-600">
              <Navigation className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Bản đồ tương tác</p>
              <p className="text-xs">Sẽ hiển thị các điểm đến</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hotel Recommendations */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="h-5 w-5 text-orange-500" />
            Gợi ý lưu trú
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.hotels.map((hotel, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{hotel.name}</h4>
                <Badge className={`${getCategoryColor(hotel.category)} border text-xs`}>
                  {hotel.category}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{hotel.reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Transportation */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-orange-500" />
            Phương tiện di chuyển
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 leading-relaxed">
              {suggestions.transport}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* General Notes */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-orange-500" />
            Lưu ý quan trọng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions.general_notes.map((note, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800 leading-relaxed">{note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg">
          Lưu kế hoạch
        </button>
        <button className="w-full border-2 border-orange-500 text-orange-600 py-3 px-4 rounded-lg font-medium hover:bg-orange-50 transition-all duration-200">
          Chia sẻ kế hoạch
        </button>
        <button className="w-full border-2 border-gray-300 text-gray-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200">
          Chỉnh sửa kế hoạch
        </button>
      </div>
    </div>
  );
};
