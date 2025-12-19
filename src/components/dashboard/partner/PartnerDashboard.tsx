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
  BarChart3,
  Search,
  Filter,
  PieChart as PieChartIcon,
  Download
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
  const [dateRange, setDateRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 500);
    return () => clearTimeout(timer);
  }, [dateRange, searchQuery]);

  const fetchDashboardData = async () => {
    const emptyData: DashboardData = {
      kpis: {
        totalTours: 0,
        publishedTours: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalReviews: 0,
      },
      recentBookings: [],
      monthlyRevenue: [],
      tours: [],
    };

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        range: dateRange,
        search: searchQuery
      });
      const response = await apiClient.get(`/partner/dashboard?${queryParams.toString()}`);
      if (response && response.success && response.data) {
        setData(response.data);
      } else {
        // If no data or success false, fallback to 0s
        setData(emptyData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // On error, fallback to 0s
      setData(emptyData);
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
  if (!data) return null;

  // Defensive destructuring with defaults
  const kpis = data.kpis || {
    totalTours: 0,
    publishedTours: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0
  };
  const recentBookings = data.recentBookings || [];
  const monthlyRevenue = data.monthlyRevenue || [];
  const tours = data.tours || [];

  // Format data for charts safely
  const revenueChartData = monthlyRevenue.map(item => {
    if (!item || !item._id) return { name: 'Unknown', revenue: 0, bookings: 0 };
    return {
      name: `Tháng ${item._id.month || '?'}/${item._id.year || '?'}`,
      revenue: item.revenue || 0,
      bookings: item.bookings || 0
    };
  });

  // Booking Status Data for Pie Chart
  const bookingStatusData = [
    { name: 'Đã xác nhận', value: kpis.confirmedBookings || 0, color: '#22c55e' }, // green-500
    { name: 'Chờ xác nhận', value: (kpis.totalBookings || 0) - (kpis.confirmedBookings || 0), color: '#eab308' }, // yellow-500
  ].filter(item => item.value > 0);

  // Status colors for PieChart
  const COLORS = ['#22c55e', '#eab308', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển Đối tác</h1>
          <p className="text-muted-foreground">
            Quản lý tour và theo dõi hiệu suất kinh doanh của bạn
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm tour..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày qua</SelectItem>
              <SelectItem value="30d">30 ngày qua</SelectItem>
              <SelectItem value="1y">1 năm qua</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Biểu đồ doanh thu</CardTitle>
            <CardDescription>
              Doanh thu theo tháng
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)}đ`}
                    />
                    <Tooltip
                      formatter={(value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                      labelStyle={{ color: 'black' }}
                    />
                    <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]} name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Chưa có dữ liệu doanh thu
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Trạng thái đặt tour</CardTitle>
            <CardDescription>
              Tỷ lệ xác nhận và chờ xử lý
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {bookingStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Chưa có dữ liệu đặt tour
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
