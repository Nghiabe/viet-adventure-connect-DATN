import apiClient from './apiClient';

export interface DashboardDateRange {
  from?: string; // ISO date string
  to?: string;   // ISO date string
}

export interface DashboardStats {
  kpiCards: {
    monthlyRevenue: {
      value: number;
      comparison: number;
      isPositive: boolean;
    };
    newBookings: {
      value: number;
      comparison: number;
      isPositive: boolean;
    };
    newUsers: {
      value: number;
      comparison: number;
      isPositive: boolean;
    };
    conversionRate: {
      value: number;
      comparison: number | null;
      isPositive: boolean;
    };
    pendingReviews: {
      value: number;
      comparison: number | null;
      isPositive: boolean;
    };
  };
  revenueChartData: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  topTours: Array<{
    tourId: string;
    title: string;
    revenue: number;
    bookings: number;
    avgRating: number;
    price: number;
  }>;
  recentBookings: Array<{
    id: string;
    user: string;
    tour: string;
    total: number;
    status: string;
    participants: number;
    bookingDate: string;
    createdAt: string;
  }>;
  additionalMetrics: {
    totalTours: number;
    activeTours: number;
    avgBookingValue: number;
    bookingStatusBreakdown: {
      confirmed: number;
      pending: number;
      cancelled: number;
      refunded: number;
    };
  };
  dateRange: {
    from: string;
    to: string;
    period: string;
  };
}

export interface DashboardApiResponse {
  success: boolean;
  data: DashboardStats;
  error?: string;
  details?: string;
}

export async function getDashboardStats(dateRange?: DashboardDateRange): Promise<DashboardStats> {
  const params = new URLSearchParams();
  
  if (dateRange?.from) {
    params.append('from', dateRange.from);
  }
  
  if (dateRange?.to) {
    params.append('to', dateRange.to);
  }

  const queryString = params.toString();
  const url = `/admin/dashboard${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<DashboardApiResponse>(url);
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load dashboard statistics');
  }
  
  return response.data;
}
