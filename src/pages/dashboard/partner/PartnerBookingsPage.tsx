import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  Mail,
  Eye
} from 'lucide-react';
import apiClient from '@/services/apiClient';
import { toast } from '@/components/ui/sonner';

interface Booking {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  type?: 'tour' | 'hotel' | 'flight' | 'train' | 'bus';
  tour?: {
    _id: string;
    title: string;
    price: number;
    duration: string;
  };
  partnerService?: {
    _id: string;
    name: string;
    type: string;
  };
  tourInfo?: {
    title: string;
    price: number;
    duration: string;
  };
  serviceInfo?: {
    title: string;
    price: number;
    duration?: string;
    nights?: number;
    checkIn?: string;
    checkOut?: string;
    roomType?: string;
  };
  bookingDate: string;
  participants: number;
  participantsBreakdown?: {
    adults?: number;
    children?: number;
  };
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'provisional';
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tourFilter, setTourFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [currentPage, searchTerm, statusFilter, tourFilter, startDate, endDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (tourFilter !== 'all') params.append('tourId', tourFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(`/partner/bookings?${params}`);
      if (response.success) {
        const data = response.data as BookingsResponse;
        setBookings(data.bookings);
        setPagination(data.pagination);
      } else {
        setError('Failed to load bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await apiClient.put(`/partner/bookings/${bookingId}/status`, {
        status: newStatus
      });

      if (response.success) {
        toast.success(`Trạng thái đã được cập nhật thành ${getStatusLabel(newStatus)}`);
        fetchBookings(); // Refresh the list
      } else {
        toast.error('Không thể cập nhật trạng thái');
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'pending': return 'Chờ xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'refunded': return 'Đã hoàn tiền';
      case 'provisional': return 'Tạm giữ';
      default: return status;
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default">Đã xác nhận</Badge>;
      case 'pending':
        return <Badge variant="secondary">Chờ xác nhận</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>;
      case 'refunded':
        return <Badge variant="outline">Đã hoàn tiền</Badge>;
      case 'provisional':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Tạm giữ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return '';
    const map: Record<string, string> = {
      'credit_card': 'Thẻ tín dụng',
      'bank_transfer': 'Chuyển khoản',
      'cash': 'Tiền mặt',
      'momo': 'Ví MoMo',
      'vnpay': 'VNPay'
    };
    return map[method] || method;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBookingTitle = (booking: Booking) => {
    return booking.serviceInfo?.title || booking.tourInfo?.title || 'Dịch vụ không xác định';
  };

  const getBookingSubtitle = (booking: Booking) => {
    if (booking.type === 'hotel' || booking.serviceInfo?.nights) {
      return booking.serviceInfo?.roomType || `${booking.serviceInfo?.nights || 0} đêm`;
    }
    return booking.serviceInfo?.duration || booking.tourInfo?.duration || '';
  };

  const getTypeLabel = (booking: Booking) => {
    const type = booking.type || (booking.tour ? 'tour' : 'hotel');
    switch (type) {
      case 'tour': return 'Tour';
      case 'hotel': return 'Khách sạn';
      case 'flight': return 'Vé máy bay';
      default: return 'Dịch vụ';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Đặt Chỗ</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý các đặt tour và dịch vụ của bạn
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tên khách hàng, dịch vụ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="provisional">Tạm giữ</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                  <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Từ ngày</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Đến ngày</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Đặt Chỗ ({pagination.total})</CardTitle>
          <CardDescription>
            Tất cả đặt tour và dịch vụ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Dịch vụ</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Số người</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày đặt</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{booking.user.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {booking.user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{getBookingTitle(booking)}</p>
                          <p className="text-sm text-muted-foreground">
                            {getBookingSubtitle(booking)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {getTypeLabel(booking)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.serviceInfo?.checkIn
                              ? new Date(booking.serviceInfo.checkIn).toLocaleDateString('vi-VN')
                              : new Date(booking.bookingDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{booking.participants} người</p>
                          {booking.participantsBreakdown && (
                            <p className="text-xs text-muted-foreground">
                              {booking.participantsBreakdown.adults || 0} lớn, {booking.participantsBreakdown.children || 0} trẻ
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(booking.totalPrice)}
                        </p>
                        {booking.paymentMethod && (
                          <p className="text-xs text-muted-foreground">
                            {getPaymentMethodLabel(booking.paymentMethod)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}
                          {(booking.status === 'pending' || booking.status === 'provisional') && (
                            <Select
                              value={booking.status}
                              onValueChange={(value) => handleStatusChange(booking._id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="confirmed">Xác nhận</SelectItem>
                                <SelectItem value="cancelled">Hủy</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {formatDate(booking.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Link to={`/dashboard/bookings/${booking._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chưa có đặt chỗ nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số{' '}
            {pagination.total} kết quả
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <span className="text-sm">
              Trang {pagination.page} / {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
