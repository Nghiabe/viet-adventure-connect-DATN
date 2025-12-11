// src/services/homepageService.ts
import { ITour, IDestination } from '@/types/models';
import apiClient from './apiClient';

export const getFeaturedTours = async () => {
  return apiClient.get<ITour[]>('/home/featured-tours');
};

export const getFeaturedDestinations = async () => {
  return apiClient.get<IDestination[]>('/home/featured-destinations');
};


