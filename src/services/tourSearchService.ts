export interface TourSearchParams {
  destinationSlug?: string;
  startDate?: string;
  adults?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  duration?: string | string[];
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc';
  page?: number;
  limit?: number;
}

export interface TourSearchResult {
  _id: string;
  title: string;
  description?: string;
  price: number;
  duration: string;
  maxGroupSize?: number;
  mainImage?: string;
  imageGallery?: string[];
  isSustainable?: boolean;
  itinerary?: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  inclusions?: string[];
  exclusions?: string[];
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  destination: {
    _id: string;
    name: string;
    slug: string;
    mainImage?: string;
  };
  owner: {
    _id: string;
    name: string;
  };
}

export interface TourSearchResponse {
  success: boolean;
  data: {
    tours: TourSearchResult[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTours: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filterCounts?: {
      ratings: Record<string, number>;
      // durations, prices, etc. can be added later
    };
    filters: {
      applied: Partial<TourSearchParams>;
    };
  };
}

import apiClient from './apiClient';

export async function searchTours(params: TourSearchParams): Promise<TourSearchResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.destinationSlug) searchParams.append('destinationSlug', params.destinationSlug);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.adults) searchParams.append('adults', params.adults.toString());
  if (params.minPrice !== undefined) searchParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice !== undefined) searchParams.append('maxPrice', params.maxPrice.toString());
  if (params.minRating !== undefined) searchParams.append('minRating', params.minRating.toString());
  if (params.duration) {
    const durationValue = Array.isArray(params.duration) ? params.duration.join(',') : params.duration;
    searchParams.append('duration', durationValue);
  }
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());

  const res = await apiClient.get<TourSearchResponse['data']>(`/tours/search?${searchParams.toString()}`);
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to fetch search results');
  }
  return { success: true, data: res.data };
}



