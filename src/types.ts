// src/types.ts

/**
 * Hotel data from backend (unified model across StayAPI, Amadeus, Web Search)
 */
export interface IHotel {
  id?: string;
  name: string;

  // Ratings
  rating?: number | null;  // 0-5 scale (normalized)
  stars?: number | null;   // Star rating 1-5
  reviewCount?: number;

  // Pricing
  price_per_night?: number | null;  // VND
  price_display?: string | null;
  total_price?: number | null;
  currency?: string;

  // Location
  location: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  distance_to_center?: string | null;

  // Details
  amenities?: string[];
  description?: string;
  images?: Array<{
    url: string;
    thumbnail?: string;
    caption?: string;
  }>;

  // Booking
  booking_url?: string | null;
  hotel_id?: string;

  // Recommendation
  why_recommended?: string;

  // Metadata
  provider?: 'stayapi' | 'amadeus' | 'web_search';

  // Legacy (for backward compat with old components)
  imageUrl?: string;
}

/**
 * Hotel search result from backend
 */
export interface IHotelSearchResult {
  hotels: IHotel[];
  total_found: number;
  provider: 'stayapi' | 'amadeus' | 'web_search';
  errors?: string[];
}
