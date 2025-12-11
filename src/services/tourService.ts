import apiClient from '@/services/apiClient';
import type { ITour, IUser } from '@/types/models';

// Interface matching enriched Tour schema
export interface EnrichedTour {
  _id: string;
  title: string;
  description?: string;
  price: number;
  duration: string;
  max_group_size?: number;

  // Location
  location: string;

  // Enriched fields
  route?: string;
  highlights?: string[];
  schedule?: {
    morning?: string;
    afternoon?: string;
    evening?: string;
  };
  category?: string;
  tips?: string;

  // Includes/Excludes
  inclusions?: string[];
  exclusions?: string[];

  // Images
  main_image?: string;
  image_gallery?: string[];
  images?: Array<{
    url: string;
    thumbnail?: string;
    caption?: string;
  }>;

  // Ratings
  average_rating?: number;
  review_count?: number;

  // Status
  is_sustainable?: boolean;
}

export interface TourDetailResponse {
  success: boolean;
  data?: {
    tour: ITour & { destination?: { name: string; slug: string }; owner?: Pick<IUser, 'name' | 'avatar'> };
    reviews: Array<{ _id: string; user: Pick<IUser, 'name' | 'avatar'>; rating: number; comment?: string; createdAt?: string }>;
  };
  tour?: EnrichedTour; // From AI service
}

export async function getTourById(id: string): Promise<TourDetailResponse['data'] | EnrichedTour> {
  // Try AI service first (for enriched tours from scraping)
  try {
    // Use /api/ai-tours proxy which maps to /v1/tours on AI service
    const aiResponse = await fetch(`/api/ai-tours/${id}`);
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      if (aiData.success && aiData.tour) {
        // Convert to format expected by frontend
        const tour = aiData.tour;
        return {
          tour: {
            _id: tour._id,
            title: tour.title,
            description: tour.description,
            price: tour.price,
            duration: tour.duration,
            maxGroupSize: tour.max_group_size,
            averageRating: tour.average_rating || 0,
            reviewCount: tour.review_count || 0,
            isSustainable: tour.is_sustainable,
            mainImage: tour.main_image,
            imageGallery: tour.image_gallery || [],
            // Enriched fields
            route: tour.route,
            highlights: tour.highlights || [],
            schedule: tour.schedule || {},
            inclusions: tour.inclusions || [],
            exclusions: tour.exclusions || [],
            tips: tour.tips,
            category: tour.category,
            images: tour.images || [],
            // Fake destination object
            destination: { name: tour.location, slug: '' }
          } as any,
          reviews: [] // AI service doesn't have reviews yet
        };
      }
    }
  } catch (e) {
    console.warn('AI service tour fetch failed, falling back to main API:', e);
  }

  // Fallback to main backend API
  const res = await apiClient.get<TourDetailResponse['data']>(`/tours/${id}`);
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to fetch tour');
  }
  return res.data;
}

export async function searchTours(params: {
  location?: string;
  category?: string;
  query?: string;
  limit?: number;
}): Promise<EnrichedTour[]> {
  const searchParams = new URLSearchParams();
  if (params.location) searchParams.set("location", params.location);
  if (params.category) searchParams.set("category", params.category);
  if (params.query) searchParams.set("query", params.query);
  if (params.limit) searchParams.set("limit", params.limit.toString());

  const response = await fetch(`/api/agents/tours/search?${searchParams.toString()}`);
  if (!response.ok) throw new Error("Failed to search tours");

  const data = await response.json();
  return data.tours || [];
}
