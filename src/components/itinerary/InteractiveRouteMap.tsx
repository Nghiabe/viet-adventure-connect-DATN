import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  icon: 'hotel' | 'attraction' | 'restaurant' | 'other';
}

interface MapRoute {
  day: number;
  polyline: string;
  distance_km: number;
  duration_minutes: number;
}

interface MapData {
  center: { lat: number; lng: number };
  markers: MapMarker[];
  routes: MapRoute[];
}

interface InteractiveRouteMapProps {
  mapData: MapData | null;
  selectedDay?: number | null;
  onDayChange?: (day: number | null) => void;
}

export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  mapData,
  selectedDay,
  onDayChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapData || !mapRef.current) return;

    // Dynamically import leaflet only when needed
    const initMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        // Initialize map if not already initialized
        if (!leafletMapRef.current) {
          leafletMapRef.current = L.default.map(mapRef.current!, {
            center: [mapData.center.lat, mapData.center.lng],
            zoom: 13
          });

          // Add OpenStreetMap tile layer
          L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(leafletMapRef.current);
        }

        // Clear existing markers
        markersRef.current.forEach(marker => {
          leafletMapRef.current?.removeLayer(marker);
        });
        markersRef.current = [];

        // Add markers
        mapData.markers.forEach(marker => {
          // Create custom icon based on type
          const iconUrl = getIconUrl(marker.icon);
          const icon = L.default.icon({
            iconUrl,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });

          const leafletMarker = L.default.marker([marker.lat, marker.lng], { icon })
            .addTo(leafletMapRef.current)
            .bindPopup(marker.label);

          markersRef.current.push(leafletMarker);
        });

        // Add routes (filter by selected day if provided)
        const routesToShow = selectedDay !== null && selectedDay !== undefined
          ? mapData.routes.filter(r => r.day === selectedDay)
          : mapData.routes;

        routesToShow.forEach(route => {
          try {
            // Decode polyline (simplified - in production use polyline library)
            // For now, we'll just draw a simple line between markers
            if (route.polyline && route.polyline.length > 0) {
              // In a real implementation, decode the polyline
              // For MVP, we can skip route lines or use a simple approximation
            }
          } catch (e) {
            console.warn('Failed to render route:', e);
          }
        });

        // Fit bounds to show all markers
        if (markersRef.current.length > 0) {
          const group = new L.default.featureGroup(markersRef.current);
          leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapData, selectedDay]);

  const getIconUrl = (iconType: string): string => {
    // Use default marker for now
    // In production, you'd use custom icons
    return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
  };

  if (!mapData) {
    return (
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
    );
  }

  // Get unique days from routes
  const days = Array.from(new Set(mapData.routes.map(r => r.day))).sort();

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-orange-500" />
          Bản đồ hành trình
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Day filter */}
        {days.length > 0 && onDayChange && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => onDayChange(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedDay === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Tất cả
            </button>
            {days.map(day => (
              <button
                key={day}
                onClick={() => onDayChange(day)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedDay === day
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Ngày {day}
              </button>
            ))}
          </div>
        )}

        {/* Map container */}
        <div
          ref={mapRef}
          className="aspect-square w-full rounded-lg border-2 border-orange-200"
          style={{ minHeight: '400px' }}
        />
      </CardContent>
    </Card>
  );
};



