import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import apiClient from '@/services/apiClient';
import { toast } from 'sonner';

interface Booking {
    _id: string;
    status: string;
    type?: string;
    createdAt: string;
    bookingDate?: string;
    participants: number;
    totalPrice: number;
    paymentMethod?: string;
    user?: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    tour?: {
        title: string;
    };
    partnerService?: {
        name: string;
    };
    tourInfo?: {
        title: string;
    };
    serviceInfo?: {
        checkIn?: string;
    };
    history?: {
        at: string;
        action: string;
        note?: string;
    }[];
}

export default function PartnerBookingDetailPage() {
    const { id } = useParams();
    const queryClient = useQueryClient();

    const { data: response, isLoading } = useQuery({
        queryKey: ['partner', 'booking', id],
        queryFn: () => apiClient.get(`/partner/bookings/${id}`)
    });

    const booking = response?.data as Booking;

    const statusMutation = useMutation({
        mutationFn: async (next: string) => {
            const res = await apiClient.put(`/partner/bookings/${id}/status`, { status: next });
            if (!res.success) throw new Error(res.error);
            return res;
        },
        onSuccess: (data, variables) => {
            const statusNote = variables === 'confirmed' ? 'đã xác nhận' : 'đã hủy';
            toast.success(`Trạng thái đặt chỗ đã được cập nhật thành ${statusNote}`);
            queryClient.invalidateQueries({ queryKey: ['partner', 'booking', id] });
        },
        onError: (err) => {
            toast.error('Không thể cập nhật trạng thái');
            console.error(err);
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                <p className="ml-4 text-lg">Đang tải chi tiết đặt chỗ...</p>
            </div>
        );
    }

    if (!booking) {
        return <div className="p-6">Không tìm thấy đặt chỗ hoặc bạn không có quyền truy cập.</div>;
    }

    const statusMap: Record<string, string> = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        cancelled: 'Đã hủy',
        refunded: 'Đã hoàn tiền',
        provisional: 'Tạm giữ'
    };

    const typeMap: Record<string, string> = {
        tour: 'Tour',
        hotel: 'Khách sạn',
        flight: 'Vé máy bay',
        service: 'Dịch vụ'
    };

    const paymentMethodMap: Record<string, string> = {
        credit_card: 'Thẻ tín dụng',
        bank_transfer: 'Chuyển khoản ngân hàng',
        cash: 'Tiền mặt',
        momo: 'Ví MoMo',
        vnpay: 'VNPay'
    };

    const statusClass =
        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Chi tiết Đặt chỗ</h2>
                    <p className="text-muted-foreground">Mã: #{String(booking._id).slice(-6)}</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-medium ${statusClass} capitalize`}>
                    {statusMap[booking.status] || booking.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold mb-4 text-lg">Thông tin Đặt chỗ</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-muted-foreground">Tên Dịch vụ</div>
                            <div className="font-medium">{booking.tour?.title || booking.partnerService?.name || booking.tourInfo?.title || 'Không xác định'}</div>

                            <div className="text-muted-foreground">Loại</div>
                            <div className="capitalize">{typeMap[booking.type || (booking.tour ? 'tour' : 'service')] || booking.type}</div>

                            <div className="text-muted-foreground">Ngày Đặt</div>
                            <div>{new Date(booking.createdAt).toLocaleDateString('vi-VN')}</div>

                            <div className="text-muted-foreground">Ngày Sử dụng</div>
                            <div>
                                {booking.serviceInfo?.checkIn
                                    ? new Date(booking.serviceInfo.checkIn).toLocaleDateString('vi-VN')
                                    : (booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('vi-VN') : 'Không xác định')}
                            </div>

                            <div className="text-muted-foreground">Số người</div>
                            <div>{booking.participants} người</div>

                            <div className="text-muted-foreground">Tổng tiền</div>
                            <div className="font-bold text-lg text-primary">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalPrice)}
                            </div>

                            <div className="text-muted-foreground">Phương thức Thanh toán</div>
                            <div className="capitalize">{paymentMethodMap[booking.paymentMethod || ''] || booking.paymentMethod?.replace('_', ' ') || 'Không xác định'}</div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold mb-4 text-lg">Khách hàng</h3>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={booking.user?.avatar} />
                                <AvatarFallback>{booking.user?.name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium text-lg">{booking.user?.name}</div>
                                <div className="text-muted-foreground">{booking.user?.email}</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold mb-4 text-lg">Hành động</h3>
                        <div className="flex flex-col gap-3">
                            <Link to={`/dashboard/chat/${booking._id}`} className="w-full">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                    Nhắn tin với khách hàng
                                </Button>
                            </Link>

                            {booking.status === 'pending' && (
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                                    onClick={() => statusMutation.mutate('confirmed')}
                                    disabled={statusMutation.isPending}
                                >
                                    Chấp nhận Đặt chỗ
                                </Button>
                            )}
                            {booking.status === 'provisional' && (
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                                    onClick={() => statusMutation.mutate('confirmed')}
                                    disabled={statusMutation.isPending}
                                >
                                    Xác nhận Đặt chỗ
                                </Button>
                            )}

                            {booking.status !== 'cancelled' && booking.status !== 'refunded' && (
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => statusMutation.mutate('cancelled')}
                                    disabled={statusMutation.isPending}
                                >
                                    Hủy Đặt chỗ
                                </Button>
                            )}
                        </div>
                    </Card>

                    {booking.history && booking.history.length > 0 && (
                        <Card className="p-6">
                            <h3 className="font-semibold mb-4 text-lg">Lịch sử</h3>
                            <div className="space-y-4">
                                {booking.history.slice().reverse().map((h: any, idx: number) => (
                                    <div key={idx} className="flex gap-3 text-sm border-l-2 border-gray-100 pl-3 pb-2 last:pb-0">
                                        <div className="text-xs text-muted-foreground min-w-[80px]">
                                            {new Date(h.at).toLocaleDateString('vi-VN')}<br />
                                            {new Date(h.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div>
                                            <div className="font-medium">{h.action === 'status_change' ? 'Thay đổi trạng thái' : h.action}</div>
                                            <div className="text-muted-foreground text-xs">{h.note}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
