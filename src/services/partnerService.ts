import apiClient from './apiClient';

export interface PartnerDashboardData {
  kpis: {
    totalTours: number;
    publishedTours: number;
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
  };
  recentBookings: Array<{
    _id: string;
    user: { name: string; email: string };
    tour: { title: string };
    totalPrice: number;
    status: string;
    bookingDate: string;
    createdAt: string;
  }>;
  monthlyRevenue: Array<{
    _id: { year: number; month: number };
    revenue: number;
    bookings: number;
  }>;
  tours: Array<{
    _id: string;
    title: string;
    price: number;
    status: string;
  }>;
}

export interface PartnerTour {
  _id: string;
  title: string;
  price: number;
  duration: string;
  status: 'draft' | 'published' | 'archived';
  description?: string;
  destination: {
    _id: string;
    name: string;
    slug: string;
  };
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerBooking {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  tour: {
    _id: string;
    title: string;
    price: number;
    duration: string;
  };
  tourInfo: {
    title: string;
    price: number;
    duration: string;
  };
  bookingDate: string;
  participants: number;
  participantsBreakdown?: {
    adults?: number;
    children?: number;
  };
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerReview {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  tour: {
    _id: string;
    title: string;
  };
  rating: number;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ToursResponse {
  tours: PartnerTour[];
  pagination: PaginationInfo;
}

export interface BookingsResponse {
  bookings: PartnerBooking[];
  pagination: PaginationInfo;
}

export interface ReviewsResponse {
  reviews: PartnerReview[];
  pagination: PaginationInfo;
  stats: {
    averageRating: number;
    totalReviews: number;
    distribution: {
      five: number;
      four: number;
      three: number;
      two: number;
      one: number;
    };
  };
}

export const partnerService = {
  // Dashboard
  async getDashboardData(): Promise<PartnerDashboardData> {
    const response = await apiClient.get('/partner/dashboard');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch dashboard data');
    }
    return response.data;
  },

  // Tours
  async getTours(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<ToursResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`/partner/tours?${queryParams}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch tours');
    }
    return response.data;
  },

  async getTour(id: string): Promise<PartnerTour> {
    const response = await apiClient.get(`/partner/tours/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch tour');
    }
    return response.data;
  },

  async createTour(tourData: Partial<PartnerTour>): Promise<PartnerTour> {
    const response = await apiClient.post('/partner/tours', tourData);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create tour');
    }
    return response.data;
  },

  async updateTour(id: string, tourData: Partial<PartnerTour>): Promise<PartnerTour> {
    const response = await apiClient.put(`/partner/tours/${id}`, tourData);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update tour');
    }
    return response.data;
  },

  async deleteTour(id: string): Promise<void> {
    const response = await apiClient.delete(`/partner/tours/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete tour');
    }
  },

  // Bookings
  async getBookings(params: {
    page?: number;
    limit?: number;
    status?: string;
    tourId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<BookingsResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.tourId) queryParams.append('tourId', params.tourId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get(`/partner/bookings?${queryParams}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch bookings');
    }
    return response.data;
  },

  // Reviews
  async getReviews(params: {
    page?: number;
    limit?: number;
    status?: string;
    tourId?: string;
    rating?: number;
  } = {}): Promise<ReviewsResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.tourId) queryParams.append('tourId', params.tourId);
    if (params.rating) queryParams.append('rating', params.rating.toString());

    const response = await apiClient.get(`/partner/reviews?${queryParams}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch reviews');
    }
    return response.data;
  },
};

export default partnerService;
