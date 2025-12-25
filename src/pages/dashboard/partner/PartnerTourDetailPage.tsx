
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Star, MapPin, Clock, ArrowLeft,
    Calendar as CalendarIcon, Edit,
    Check, X, Navigation, Sparkles, AlertCircle
} from 'lucide-react';
import apiClient from '@/services/apiClient';
import { getCategoryInfo } from '@/lib/tourConfig';
import { getStatusBadge } from './PartnerToursPage';
import { GradientPlaceholder } from '@/components/ui/GradientPlaceholder';

const PartnerTourDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const fetchTour = async () => {
        const response = await apiClient.get<any>(`/partner/tours/${id}`);
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error);
    };

    const { data: tour, isLoading, isError, error } = useQuery({
        queryKey: ['partnerTour', id],
        queryFn: fetchTour,
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                    <div className="h-10 w-48 bg-muted animate-pulse rounded" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-xl" />
                    <div className="h-96 bg-muted animate-pulse rounded-xl" />
                </div>
            </div>
        );
    }

    if (isError || !tour) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold mb-2">Không tìm thấy tour</h2>
                <p className="text-muted-foreground mb-4">{(error as any)?.message || 'Đã có lỗi xảy ra'}</p>
                <Button onClick={() => navigate('/dashboard/tours')}>Quay lại danh sách</Button>
            </div>
        );
    }

    // Derived Values
    const category = tour.category || 'tham_quan';
    const catConfig = getCategoryInfo(category);
    const images = (tour.images && tour.images.length > 0)
        ? tour.images.map((img: any) => img.url || img.thumbnail)
        : (tour.imageGallery && tour.imageGallery.length > 0)
            ? tour.imageGallery
            : tour.mainImage
                ? [tour.mainImage]
                : [null];

    const hasValidImages = images[0] !== null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/tours')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold truncate max-w-xl" title={tour.title}>{tour.title}</h1>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {tour.destination?.name || (tour.destinations?.[0]?.destinationName) || 'Chưa cập nhật'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                ID: {tour._id.substring(0, 8)}...
                            </span>
                            <span>•</span>
                            {getStatusBadge(tour.status)}
                        </div>
                    </div>
                </div>
                <Button onClick={() => console.log('Edit clicked')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa Tour
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Images & Content */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Image Gallery */}
                    <Card className="overflow-hidden">
                        <div className="relative h-[400px]">
                            {hasValidImages ? (
                                <img
                                    src={images[selectedImageIndex]}
                                    alt={tour.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <GradientPlaceholder category={category} title={tour.title} size="lg" />
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="p-4 flex gap-2 overflow-x-auto bg-muted/50">
                                {images.slice(0, 8).map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`relative flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Highlights & Route */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className=" text-base flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    Điểm nổi bật
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tour.highlights && tour.highlights.length > 0 ? (
                                    <ul className="space-y-2">
                                        {tour.highlights.map((h: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <div className="mt-1 p-0.5 bg-green-100 dark:bg-green-900 rounded-full text-green-600 dark:text-green-400">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Chưa có thông tin</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Navigation className="w-5 h-5 text-primary" />
                                    Lộ trình
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tour.route ? (
                                    <p className="text-sm text-muted-foreground leading-relaxed">{tour.route}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Chưa có thông tin</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Mô tả chi tiết</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground text-sm">
                                {tour.description || 'Chưa có mô tả'}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Schedule */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lịch trình</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Priority 1: Check for 'itinerary' array (Standard DB format) */}
                            {tour.itinerary && tour.itinerary.length > 0 ? (
                                <div className="space-y-6">
                                    {tour.itinerary.map((item: any, idx: number) => (
                                        <div key={idx} className="relative pl-6 border-l-2 border-primary/20 pb-4 last:pb-0">
                                            <div className="absolute top-0 left-[-5px] w-2.5 h-2.5 rounded-full bg-primary" />
                                            <h4 className="font-semibold text-base mb-1">Ngày {item.day}: {item.title}</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-line">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : tour.schedule ? (
                                /* Priority 2: Check for 'schedule' object (Legacy/AI format) */
                                <div className="space-y-4">
                                    {tour.schedule.morning && (
                                        <div className="flex gap-4">
                                            <div className="w-16 font-medium text-amber-600 dark:text-amber-400">Sáng</div>
                                            <div className="flex-1 text-sm text-muted-foreground border-l-2 border-amber-100 dark:border-amber-900 pl-4">{tour.schedule.morning}</div>
                                        </div>
                                    )}
                                    {tour.schedule.afternoon && (
                                        <div className="flex gap-4">
                                            <div className="w-16 font-medium text-orange-600 dark:text-orange-400">Chiều</div>
                                            <div className="flex-1 text-sm text-muted-foreground border-l-2 border-orange-100 dark:border-orange-900 pl-4">{tour.schedule.afternoon}</div>
                                        </div>
                                    )}
                                    {tour.schedule.evening && (
                                        <div className="flex gap-4">
                                            <div className="w-16 font-medium text-indigo-600 dark:text-indigo-400">Tối</div>
                                            <div className="flex-1 text-sm text-muted-foreground border-l-2 border-indigo-100 dark:border-indigo-900 pl-4">{tour.schedule.evening}</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Chưa có thông tin lịch trình</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Stats & Meta */}
                <div className="space-y-6">
                    {/* Price Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <p className="text-sm text-muted-foreground">Giá công khai</p>
                            <div className="text-3xl font-bold text-primary">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tour.price)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3 pt-4 border-t">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Thời lượng
                                    </span>
                                    <span className="font-medium">{tour.duration}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4" /> Khởi hành
                                    </span>
                                    <span className="font-medium">{tour.start_dates?.length > 0 ? `${tour.start_dates.length} lịch` : 'Hàng ngày'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Star className="w-4 h-4" /> Đánh giá
                                    </span>
                                    <span className="font-medium">{tour.averageRating || 0} ({tour.reviewCount || 0})</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inclusions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Dịch vụ bao gồm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tour.inclusions && tour.inclusions.length > 0 ? (
                                <ul className="space-y-2">
                                    {tour.inclusions.map((inc: string, i: number) => (
                                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                                            {inc}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">Chưa cập nhật</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Exclusions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Không bao gồm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tour.exclusions && tour.exclusions.length > 0 ? (
                                <ul className="space-y-2">
                                    {tour.exclusions.map((exc: string, i: number) => (
                                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                            <X className="w-4 h-4 text-red-500 shrink-0" />
                                            {exc}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">Chưa cập nhật</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tips */}
                    {tour.tips && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                            <p className="font-medium flex items-center gap-2 mb-1">💡 Mẹo hữu ích</p>
                            {tour.tips}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartnerTourDetailPage;
