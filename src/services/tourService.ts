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
  // 1. Fetch from Main Backend (Source of Truth for IDs, Reviews, Bookings)
  const backendPromise = apiClient.get<TourDetailResponse['data']>(`/tours/${id}`)
    .then(res => res.data)
    .catch(err => {
      console.warn('Backend tour fetch failed:', err);
      return null;
    });

  // 2. Fetch from AI Service (Enrichment source)
  const aiPromise = fetch(`/api/ai-tours/${id}`)
    .then(res => res.ok ? res.json() : null)
    .then(data => data?.success ? data.tour : null)
    .catch(() => null);

  const [backendData, aiTour] = await Promise.all([backendPromise, aiPromise]);

  // Case A: We have backend data (this is a real DB tour)
  if (backendData) {
    const { tour, reviews } = backendData;

    // Merge AI enrichment if available
    let finalTour = { ...tour };
    if (aiTour) {
      finalTour = {
        ...finalTour,
        // Overlay enriched fields if they are missing or better in AI data
        route: finalTour.route || aiTour.route,
        highlights: (finalTour.highlights && finalTour.highlights.length) ? finalTour.highlights : aiTour.highlights,
        schedule: finalTour.schedule || aiTour.schedule,
        tips: finalTour.tips || aiTour.tips,
        inclusions: (finalTour.inclusions && finalTour.inclusions.length) ? finalTour.inclusions : aiTour.inclusions,
        exclusions: (finalTour.exclusions && finalTour.exclusions.length) ? finalTour.exclusions : aiTour.exclusions,
        imageGallery: (finalTour.imageGallery && finalTour.imageGallery.length) ? finalTour.imageGallery : aiTour.image_gallery
      };
    }

    return {
      tour: finalTour as any, // Cast to handle schema intersections
      reviews: reviews || []
    };
  }

  // Case B: Backend failed, but we have AI data (e.g. external/scraped tour)
  if (aiTour) {
    return {
      tour: {
        _id: aiTour._id,
        title: aiTour.title,
        description: aiTour.description,
        price: aiTour.price,
        duration: aiTour.duration,
        maxGroupSize: aiTour.max_group_size,
        averageRating: aiTour.average_rating || 0,
        reviewCount: aiTour.review_count || 0,
        isSustainable: aiTour.is_sustainable,
        mainImage: aiTour.main_image,
        imageGallery: aiTour.image_gallery || [],
        route: aiTour.route,
        highlights: aiTour.highlights || [],
        schedule: aiTour.schedule || {},
        inclusions: aiTour.inclusions || [],
        exclusions: aiTour.exclusions || [],
        tips: aiTour.tips,
        category: aiTour.category,
        images: aiTour.images || [],
        destination: { name: aiTour.location, slug: '' }
      } as any,
      reviews: [] // No reviews for AI-only tours
    };
  }

  throw new Error('Failed to fetch tour details');
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
