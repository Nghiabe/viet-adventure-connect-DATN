import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Calendar,
    MapPin,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Printer,
    CreditCard,
    ShieldCheck,
    Plane,
    ChevronRight,
    Hotel,
    Bus,
    MessageCircle
} from 'lucide-react';

import apiClient from '@/services/apiClient';
import { Header } from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrencyVND } from '@/utils/format';
import { translateStatus } from '@/utils/translation';

interface BookingDetail {
    _id: string;
    status: string;
    bookingDate: string;
    participants: number;
    participantsBreakdown: { adults: number; children: number };
    totalPrice: number;
    paymentMethod: string;
    type: 'tour' | 'hotel' | 'flight' | 'transport'; // Added type
    serviceInfo?: {
        title?: string;
        image?: string;
        destination?: string;
    };
    tour?: {
        _id: string;
        title: string;
        mainImage?: string;
        duration: string;
        route?: string;
        itinerary?: Array<{ day: number; title: string; description: string }>;
        destination?: { name: string };
        location?: string;
    };
    partnerService?: {
        _id: string;
        name: string;
        address?: string;
        image?: string;
        type?: string;
        location?: string;
        city?: string;
        description?: string;
    };
    createdAt: string;
}

export default function BookingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();

    const { data: booking, isLoading, isError, error } = useQuery({
        queryKey: ['booking', id],
        queryFn: async () => {
            const res = await apiClient.get<BookingDetail>(`/bookings/${id}`);
            if (!res.success || !res.data) {
                throw new Error(res.error || 'Failed to fetch booking details');
            }
            return res.data;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-secondary flex flex-col">
                <Header />
                <div className="flex-1 container mx-auto px-4 py-8 mt-16 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Đang tải thông tin chuyến đi...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (isError || !booking) {
        return (
            <div className="min-h-screen bg-secondary flex flex-col">
                <Header />
                <div className="flex-1 container mx-auto px-4 py-8 mt-16 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Không tìm thấy chuyến đi</h2>
                    <p className="text-muted-foreground mb-6">{(error as any)?.message || 'Có lỗi xảy ra khi tải thông tin.'}</p>
                    <Button asChild>
                        <Link to="/profile">quay lại Của tôi</Link>
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    // Normalize Data for Display (Handle Tour vs Hotel vs Service)
    const displayData = {
        title: booking.serviceInfo?.title || booking.tour?.title || booking.partnerService?.name || 'Chi tiết đặt chỗ',
        image: booking.serviceInfo?.image || booking.tour?.mainImage || booking.partnerService?.image || "",
        location: booking.serviceInfo?.destination || booking.tour?.location || booking.tour?.destination?.name || booking.partnerService?.address || booking.partnerService?.location || 'Việt Nam',
        duration: booking.tour?.duration || 'Linh hoạt',
        route: booking.tour?.route || '',
        description: booking.partnerService?.description || '',
        isHotel: booking.type === 'hotel' || (!booking.tour && !!booking.partnerService),
        isTour: booking.type === 'tour' || !!booking.tour
    };

    const isUpcoming = ['pending', 'confirmed'].includes(booking.status);

    return (
        <div className="min-h-screen bg-secondary flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 mt-20 mb-12">
                {/* Navigation Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                    <Link to="/profile" className="hover:text-primary transition-colors flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Hồ sơ
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link to="/profile?tab=journeys" className="hover:text-primary transition-colors">
                        Chuyến đi của tôi
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="font-medium text-foreground truncate max-w-[200px]">{displayData.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Tour Info & Itinerary */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Hero Card */}
                        <div className="bg-background rounded-xl overflow-hidden shadow-sm border">
                            <div className="relative h-64 md:h-80 w-full group">
                                <ResilientImage
                                    src={displayData.image}
                                    alt={displayData.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white w-full">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge className={`${booking.status === 'confirmed' ? 'bg-green-500' : booking.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'} border-none text-white px-3 py-1 text-sm font-medium uppercase tracking-wide`}>
                                            {translateStatus(booking.status, t)}
                                        </Badge>

                                        {displayData.isTour && (
                                            <div className="flex items-center gap-1 text-xs md:text-sm bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                                <span>{displayData.duration}</span>
                                            </div>
                                        )}
                                        {displayData.isHotel && (
                                            <div className="flex items-center gap-1 text-xs md:text-sm bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                                <Hotel className="w-3 h-3 md:w-4 md:h-4" />
                                                <span>Lưu trú</span>
                                            </div>
                                        )}
                                    </div>
                                    <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-2 drop-shadow-md">{displayData.title}</h1>
                                    <div className="flex items-center gap-2 text-gray-200 text-sm md:text-base">
                                        <MapPin className="w-4 h-4" />
                                        <span>{displayData.location}</span>
                                        {displayData.route && (
                                            <>
                                                <span className="mx-1">•</span>
                                                <span className="opacity-90">{displayData.route}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Itinerary Section (Only for Tours) */}
                        {displayData.isTour && booking.tour?.itinerary && booking.tour.itinerary.length > 0 && (
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Plane className="w-5 h-5 text-primary" />
                                        Lịch trình tour
                                    </CardTitle>
                                    <CardDescription>Chi tiết các hoạt động trong chuyến đi của bạn</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-8 pl-2">
                                        {booking.tour.itinerary.map((item, idx) => (
                                            <div key={idx} className="relative pl-8 border-l-2 border-primary/20 last:border-l-0 pb-8 last:pb-0">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-primary/20" />
                                                <div>
                                                    <h4 className="text-lg font-bold text-foreground mb-1">Ngày {item.day}: {item.title}</h4>
                                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Description Section (For Hotels/Others) */}
                        {displayData.isHotel && displayData.description && (
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                        Thông tin dịch vụ
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{displayData.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {displayData.isTour && !booking.tour?.itinerary?.length && (
                            <Card className="border-none shadow-sm text-center py-12">
                                <CardContent>
                                    <p className="text-muted-foreground italic">chi tiết lịch trình đang được cập nhật...</p>
                                </CardContent>
                            </Card>
                        )}

                    </div>

                    {/* RIGHT COLUMN: Booking Details & Summary */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Booking Summary Card */}
                        <Card className="border-none shadow-md sticky top-24">
                            <CardHeader className="bg-primary/5 pb-4">
                                <CardTitle className="text-lg font-bold flex items-center justify-between">
                                    Thông tin đặt chỗ
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                </CardTitle>
                                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">#{booking._id.slice(-8)}</p>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">

                                {/* User Info Group */}
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Ngày khởi hành</p>
                                            <p className="font-semibold text-foreground">
                                                {format(new Date(booking.bookingDate), 'd MMMM, yyyy', { locale: vi })}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {format(new Date(booking.bookingDate), 'EEEE', { locale: vi })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Hành khách</p>
                                            <p className="font-semibold text-foreground">{booking.participants} người</p>
                                            <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                                                <span>{booking.participantsBreakdown?.adults || booking.participants} Người lớn</span>
                                                {booking.participantsBreakdown?.children ? (
                                                    <span>• {booking.participantsBreakdown.children} Trẻ em</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Payment Info */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-muted-foreground">Phương thức thanh toán</span>
                                        <span className="text-sm font-medium capitalize">{booking.paymentMethod || 'Tiền mặt'}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="font-semibold text-lg">Tổng tiền</span>
                                        <span className="text-2xl font-bold text-primary">{formatCurrencyVND(booking.totalPrice)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-2 space-y-3">
                                    <Button
                                        className="w-full gap-2 font-medium bg-blue-600 hover:bg-blue-700 text-white"
                                        size="lg"
                                        asChild
                                    >
                                        <Link to={`/chat/${id}`}>
                                            <MessageCircle className="w-4 h-4" />
                                            Chat với nhà cung cấp
                                        </Link>
                                    </Button>

                                    <Button
                                        className="w-full gap-2 font-medium"
                                        size="lg"
                                        variant="outline"
                                        onClick={() => window.print()}
                                    >
                                        <Printer className="w-4 h-4" />
                                        In phiếu xác nhận
                                    </Button>

                                    {isUpcoming && (
                                        <Button
                                            variant="outline"
                                            className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
                                            onClick={async () => {
                                                if (!window.confirm("Bạn có chắc chắn muốn hủy đặt chỗ này không?")) return;

                                                try {
                                                    const res = await apiClient.patch(`/bookings/${id}/cancel`, {});
                                                    if (res.success) {
                                                        // Refresh data
                                                        // Ideally use queryClient.invalidateQueries, but basic reload works for now or let react-query refetch
                                                        window.location.reload();
                                                    } else {
                                                        alert(res.error || "Không thể hủy đặt chỗ");
                                                    }
                                                } catch (e: any) {
                                                    alert(e.message || "Có lỗi xảy ra");
                                                }
                                            }}
                                        >
                                            Hủy đặt chỗ
                                        </Button>
                                    )}

                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                                        <ShieldCheck className="w-3 h-3 text-green-600" />
                                        <span>Bảo mật thanh toán & thông tin cá nhân</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Assistance Card */}
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-blue-900 mb-2">Bạn cần hỗ trợ?</h3>
                                <p className="text-sm text-blue-700/80 mb-4">
                                    Đội ngũ CSKH của chúng tôi luôn sẵn sàng 24/7 để giải đáp thắc mắc về chuyến đi của bạn.
                                </p>
                                <Button variant="ghost" className="w-full bg-white text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-medium shadow-sm">
                                    Liên hệ ngay
                                </Button>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
