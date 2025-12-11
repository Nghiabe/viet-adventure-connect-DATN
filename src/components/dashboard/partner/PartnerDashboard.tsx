import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Star, 
  DollarSign, 
  Calendar,
  Eye,
  Plus,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '@/services/apiClient';

interface DashboardData {
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

export default function PartnerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/partner/dashboard');
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Thử lại</Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, recentBookings, monthlyRevenue, tours } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển Đối tác</h1>
          <p className="text-muted-foreground">
            Quản lý tour và theo dõi hiệu suất kinh doanh của bạn
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/dashboard/my-tours">
              <Plus className="mr-2 h-4 w-4" />
              Thêm Tour
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/my-tours">
              <Eye className="mr-2 h-4 w-4" />
              Xem tất cả
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Tour</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalTours}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.publishedTours} đã xuất bản
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Đặt Tour</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.confirmedBookings} đã xác nhận
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(kpis.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Từ các tour đã xác nhận
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đánh giá TB</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Từ {kpis.totalReviews} đánh giá
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings and Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Bookings */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Đặt Tour Gần Đây</CardTitle>
            <CardDescription>
              Các đặt tour mới nhất cho tour của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {booking.user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.tour.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.bookingDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(booking.totalPrice)}
                      </p>
                      <Badge 
                        variant={
                          booking.status === 'confirmed' ? 'default' :
                          booking.status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {booking.status === 'confirmed' ? 'Đã xác nhận' :
                         booking.status === 'pending' ? 'Chờ xác nhận' :
                         booking.status === 'cancelled' ? 'Đã hủy' : booking.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có đặt tour nào
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Tour của bạn</CardTitle>
            <CardDescription>
              Tổng quan nhanh về tour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tours.slice(0, 5).map((tour) => (
                <div key={tour._id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {tour.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(tour.price)}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      tour.status === 'published' ? 'default' :
                      tour.status === 'draft' ? 'secondary' : 'outline'
                    }
                  >
                    {tour.status === 'published' ? 'Đã xuất bản' :
                     tour.status === 'draft' ? 'Bản nháp' : 'Lưu trữ'}
                  </Badge>
                </div>
              ))}
              {tours.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có tour nào
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart Placeholder */}
      {monthlyRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
            <CardDescription>
              Biểu đồ doanh thu 6 tháng gần đây
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Biểu đồ doanh thu sẽ được hiển thị ở đây</p>
                <p className="text-sm">
                  Tổng doanh thu: {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
