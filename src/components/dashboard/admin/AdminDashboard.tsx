import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users, ShoppingCart, Star, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { getDashboardStats } from '@/services/dashboardApi';
import { DateRange } from 'react-day-picker';
import DashboardSkeleton from '@/components/dashboard/ui/DashboardSkeleton';
import ErrorMessage from '@/components/dashboard/ui/ErrorMessage';
import DateRangeFilter from '@/components/dashboard/ui/DateRangeFilter';
import CombinedRevenueChart from '@/components/dashboard/widgets/CombinedRevenueChart';
import TopPerformingTable from '@/components/dashboard/widgets/TopPerformingTable';
import ActivityFeed from '@/components/dashboard/widgets/ActivityFeed';
import BookingHeatmap from '@/components/dashboard/widgets/BookingHeatmap';

// KPI Card Component
function KpiCard({ 
  title, 
  value, 
  comparison, 
  isPositive, 
  icon: Icon,
  link 
}: { 
  title: string; 
  value: string | number; 
  comparison?: number | null; 
  isPositive?: boolean; 
  icon?: any;
  link?: string;
}) {
  const content = (
    <Card className="bg-card border border-border p-4 hover:bg-card/80 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-secondary-foreground flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {title}
          </div>
          <div className="text-2xl font-semibold mt-1 text-foreground">
            {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
          </div>
          {comparison !== null && comparison !== undefined && (
            <div className="text-xs mt-1 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(comparison)}%
              </span>
              <span className="text-secondary-foreground">vs kỳ trước</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (link) {
    return (
      <a href={link} className="block">
        {content}
      </a>
    );
  }

  return content;
}

// Recent Bookings Table Component
function RecentBookingsTable({ bookings }: { bookings: any[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300';
      case 'refunded':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xử lý';
      case 'cancelled':
        return 'Đã hủy';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  return (
    <Card className="bg-card border border-border p-0 overflow-hidden">
      <div className="p-4 font-semibold border-b border-border">Đơn đặt gần đây</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr>
              <th className="text-left p-3">Mã</th>
              <th className="text-left p-3">Khách hàng</th>
              <th className="text-left p-3">Tour</th>
              <th className="text-right p-3">Tổng tiền</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-left p-3">Ngày đặt</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Không có đơn đặt nào gần đây
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs">{booking.id.slice(-8)}</td>
                  <td className="p-3">{booking.user}</td>
                  <td className="p-3 max-w-xs truncate">{booking.tour}</td>
                  <td className="p-3 text-right font-medium">
                    {booking.total.toLocaleString('vi-VN')}₫
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {format(new Date(booking.createdAt), 'dd/MM/yyyy', { locale: vi })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}



export default function AdminDashboard() {
  // Set default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29); // 30 days including today
    return { from, to };
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adminDashboardStats', dateRange],
    queryFn: () => {
      // Convert DateRange to the format expected by the API
      const apiDateRange = {
        from: dateRange?.from?.toISOString(),
        to: dateRange?.to?.toISOString()
      };
      return getDashboardStats(apiDateRange);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  // Show loading skeleton
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show error message
  if (isError) {
    return (
      <ErrorMessage
        title="Không thể tải dữ liệu Dashboard"
        message={error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định'}
        onRetry={() => refetch()}
      />
    );
  }

  // Show empty state if no data
  if (!data) {
    return (
      <ErrorMessage
        title="Không có dữ liệu"
        message="Không tìm thấy dữ liệu cho khoảng thời gian đã chọn"
        onRetry={() => refetch()}
      />
    );
  }

  const { kpiCards, revenueChartData, topTours, recentBookings, additionalMetrics, dateRange: dataDateRange } = data;

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="mb-6">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard
          title="Doanh thu tháng"
          value={`${kpiCards.monthlyRevenue.value.toLocaleString('vi-VN')}₫`}
          comparison={kpiCards.monthlyRevenue.comparison}
          isPositive={kpiCards.monthlyRevenue.isPositive}
          icon={TrendingUp}
        />
        <KpiCard
          title="Đơn đặt mới"
          value={kpiCards.newBookings.value}
          comparison={kpiCards.newBookings.comparison}
          isPositive={kpiCards.newBookings.isPositive}
          icon={ShoppingCart}
          link="/dashboard/bookings"
        />
        <KpiCard
          title="Người dùng mới"
          value={kpiCards.newUsers.value}
          comparison={kpiCards.newUsers.comparison}
          isPositive={kpiCards.newUsers.isPositive}
          icon={Users}
        />
        <KpiCard
          title="Tỉ lệ chuyển đổi"
          value={`${kpiCards.conversionRate.value}%`}
          comparison={kpiCards.conversionRate.comparison}
          isPositive={kpiCards.conversionRate.isPositive}
          icon={TrendingUp}
        />
        <KpiCard
          title="Đánh giá chờ duyệt"
          value={kpiCards.pendingReviews.value}
          comparison={kpiCards.pendingReviews.comparison}
          isPositive={kpiCards.pendingReviews.isPositive}
          icon={Clock}
          link="/dashboard/moderation"
        />
      </div>

      {/* Middle Row - Charts and Top Performing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CombinedRevenueChart data={revenueChartData.map(item => ({
            month: item.date,
            revenue: item.revenue,
            bookings: item.bookings
          }))} />
        </div>
        <div>
          <TopPerformingTable
            tours={topTours.map((tour, i) => ({
              rank: i + 1,
              name: tour.title,
              value: tour.revenue,
              link: `/dashboard/tours?tourId=${tour.tourId}`
            }))}
            partners={[]}
          />
        </div>
      </div>

      {/* Bottom Row - Recent Bookings and Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RecentBookingsTable bookings={recentBookings} />
        </div>
        <div className="space-y-4">
          <BookingHeatmap />
          <ActivityFeed 
            live={[]} 
            moderation={{ 
              pendingReviews: kpiCards.pendingReviews.value, 
              pendingPartners: 0 
            }} 
          />
        </div>
      </div>

      {/* Additional Metrics (Hidden by default, can be expanded) */}
      <div className="text-xs text-muted-foreground text-center">
        Dữ liệu được cập nhật lần cuối: {format(new Date(), 'HH:mm:ss dd/MM/yyyy', { locale: vi })}
        {dataDateRange.period && ` • Khoảng thời gian: ${dataDateRange.period}`}
      </div>
    </div>
  );
}


