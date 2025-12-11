import apiClient from '@/services/apiClient';
import type { IDestination, ITour } from '@/types/models';

export interface DestinationDetailResponse {
  success: boolean;
  data: {
    destination: IDestination;
    associatedTours: Array<Pick<ITour, '_id' | 'title' | 'price' | 'duration' | 'averageRating' | 'reviewCount' | 'isSustainable' | 'mainImage'>> & { destination?: { name: string } }[];
    associatedStories?: Array<{ _id: string; title: string; coverImage?: string; author?: { name: string; avatar?: string }; createdAt?: string }>;
  };
}

export async function getDestinationBySlug(slug: string): Promise<DestinationDetailResponse['data']> {
  const res = await apiClient.get<DestinationDetailResponse['data']>(`/destinations/${slug}`);
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to fetch destination');
  }
  return res.data;
}





