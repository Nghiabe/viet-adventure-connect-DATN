/**
 * ExperienceDetail Page
 * Displays detailed tour information with booking functionality.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/home/Header';
import { Footer } from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GradientPlaceholder } from '@/components/ui/GradientPlaceholder';
import { getCategoryInfo } from '@/lib/tourConfig';
import { getAllTourImages, formatPriceVND, parseScheduleByDay } from '@/lib/tourUtils';
import {
  Star, MapPin, Clock, Users, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Check, X, Navigation,
  Heart, Share2, Sun, Sunset, Moon, ArrowRight, Sparkles, MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getTourById } from '@/services/tourService';
import BookingConfirmationModal from '@/components/tours/BookingConfirmationModal';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import ReviewForm from '@/components/reviews/ReviewForm';

// Star Rating Component
const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => {
  const starSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`${starSize} ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );
};

const ExperienceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tourDetail', id],
    queryFn: () => getTourById(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Availability State
  const [availability, setAvailability] = useState<{ available: number, max: number, booked: number } | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const tour = (data as any)?.tour;
  const reviews = (data as any)?.reviews || [];
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChat = async () => {
    if (!user) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để chat với nhà cung cấp.",
        variant: "default"
      });
      navigate('/login');
      return;
    }

    try {
      const res = await apiClient.post<any>('/chat/inquiry', { tourId: id });
      if (res.success && res.data) {
        navigate(`/chat/${res.data.bookingId}`);
      }
    } catch (error) {
      console.error("Chat error", error);
      toast({
        title: "Lỗi",
        description: "Không thể kết nối trò chuyện.",
        variant: "destructive"
      });
    }
  };

  // Check Availability Effect
  useEffect(() => {
    const checkAvailability = async () => {
      if (!id || !selectedDate) {
        setAvailability(null);
        return;
      }

      setIsCheckingAvailability(true);
      try {
        // Format date as YYYY-MM-DD for consistency
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        // Manually construct query string since apiClient.get doesn't accept config object
        const res = await apiClient.get<any>(`/tours/${id}/availability?date=${dateStr}`);

        if (res.success && res.data) {
          setAvailability({
            available: res.data.available,
            max: res.data.maxGroupSize,
            booked: res.data.bookedCount
          });
        }
      } catch (error) {
        console.error("Failed to check availability:", error);
        toast({
          title: "Lỗi",
          description: "Không thể kiểm tra tình trạng chỗ. Vui lòng thử lại.",
          variant: "destructive"
        });
        setAvailability(null);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [id, selectedDate, toast]);

  // Check Review Eligibility
  const [canReview, setCanReview] = useState(false);
  useEffect(() => {
    if (user && id) {
      apiClient.get<any>(`/reviews/check/${id}`).then(res => {
        if (res.success && res.data && res.data.canReview) {
          setCanReview(true);
        } else {
          setCanReview(false);
        }
      }).catch(err => {
        console.error("Error checking review eligibility", err);
        setCanReview(false);
      });
    } else {
      setCanReview(false);
    }
  }, [user, id]);

  const price = Number(tour?.price ?? 0);
  const totalPrice = price * adults + (price * 0.7 * children);

  // Get images - prioritize enriched images
  const getImages = () => {
    if (!tour) return [null];
    if ((tour as any).images && (tour as any).images.length > 0) {
      return (tour as any).images.map((img: any) => img.url || img.thumbnail || null);
    }
    if (tour.imageGallery && tour.imageGallery.length > 0) return tour.imageGallery;
    if (tour.mainImage) return [tour.mainImage];
    return [null];
  };

  const images = getImages();
  const hasValidImages = images[0] !== null;

  // Tour details
  const category = (tour as any)?.category || 'tham_quan';
  const catConfig = getCategoryInfo(category);
  const route = (tour as any)?.route || '';
  const highlights = (tour as any)?.highlights || [];
  const schedule = (tour as any)?.schedule || {};
  const inclusions = (tour as any)?.inclusions || [];
  const exclusions = (tour as any)?.exclusions || [];
  const tips = (tour as any)?.tips || '';
  const location = (tour as any)?.location || (tour?.destination as any)?.name || '';

  const nextImage = () => setSelectedImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 container mx-auto px-4 py-8">
          <div className="h-96 bg-muted animate-pulse rounded-2xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-10 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
              <div className="h-40 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-80 bg-muted animate-pulse rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 container mx-auto px-4 py-8">
          <ErrorMessage title="Không tải được tour" message={(error as any)?.message || 'Vui lòng thử lại sau.'} showRetry onRetry={() => refetch()} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <BookingConfirmationModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        tourId={tour?._id || ''}
        tourName={tour?.title || ''}
        duration={tour?.duration}
        departureDate={selectedDate!}
        participants={{ adults, children }}
        unitPrice={price}
      />

      <main className="pt-20">
        {/* Hero Image Gallery */}
        <section className="relative h-[500px] overflow-hidden">
          {hasValidImages ? (
            <img
              src={images[selectedImageIndex]}
              alt={tour?.title || ''}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <GradientPlaceholder category={category} title={tour?.title || ''} size="lg" />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all">
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Category & Action buttons */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 bg-gradient-to-r ${catConfig.gradient} text-white shadow-lg`}>
              {catConfig.icon}
              {catConfig.label}
            </div>
            <div className="flex gap-2">
              <button onClick={handleChat} className="p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all text-primary">
                <MessageCircle className="w-5 h-5" />
              </button>
              <button onClick={() => setIsFavorited(!isFavorited)} className="p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all">
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
              </button>
              <button className="p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all">
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-8 left-0 right-0 px-4">
            <div className="container mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 max-w-3xl">{tour?.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{tour?.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={tour?.averageRating || 0} size="lg" />
                  <span className="font-semibold">{(tour?.averageRating || 0).toFixed(1)}</span>
                  <span>({tour?.reviewCount || 0} đánh giá)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="bg-white border-b py-3">
            <div className="container mx-auto px-4">
              <div className="flex gap-2 overflow-x-auto">
                {images.slice(0, 8).map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden ${selectedImageIndex === idx ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
                  >
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${catConfig.gradient}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Route Box */}
              {route && (
                <div className="p-5 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/20 rounded-full">
                      <Navigation className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Lộ trình</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{route}</p>
                </div>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Điểm nổi bật
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {highlights.map((h: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border shadow-sm">
                        <div className="p-1 bg-green-100 rounded-full">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-gray-700">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {tour?.description && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Mô tả</h3>
                  <p className="text-gray-600 leading-relaxed">{tour.description}</p>
                </div>
              )}

              {/* Schedule - Display by Day */}
              {(schedule.morning || schedule.afternoon || schedule.evening) && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Lịch trình chi tiết</h3>
                  {(() => {
                    // Parse schedule text to extract by day
                    const parseScheduleByDay = () => {
                      const allText = [
                        schedule.morning ? `Sáng: ${schedule.morning}` : '',
                        schedule.afternoon ? `Chiều: ${schedule.afternoon}` : '',
                        schedule.evening ? `Tối: ${schedule.evening}` : ''
                      ].filter(Boolean).join(' | ');

                      // Extract day patterns: "Ngày 1:", "Ngày 2:", etc.
                      const dayPattern = /Ngày\s*(\d+)[:\s]/gi;
                      const days: { day: number; activities: { time: string; content: string }[] }[] = [];

                      // Check if data contains day markers
                      const hasMultipleDays = allText.match(dayPattern);

                      if (!hasMultipleDays) {
                        // Single day tour - just show morning/afternoon/evening
                        return [{
                          day: 1,
                          activities: [
                            schedule.morning ? { time: 'Sáng', content: schedule.morning, color: 'amber' } : null,
                            schedule.afternoon ? { time: 'Chiều', content: schedule.afternoon, color: 'orange' } : null,
                            schedule.evening ? { time: 'Tối', content: schedule.evening, color: 'indigo' } : null
                          ].filter(Boolean)
                        }];
                      }

                      // Multi-day tour - parse by day
                      const result: { day: number; activities: { time: string; content: string; color: string }[] }[] = [];

                      // Parse morning
                      const parsePeriod = (text: string | undefined, periodName: string, color: string) => {
                        if (!text) return;

                        // Split by "Ngày X:" pattern
                        const parts = text.split(/Ngày\s*(\d+)[:\s]/i).filter(Boolean);

                        for (let i = 0; i < parts.length; i += 2) {
                          const dayNum = parseInt(parts[i]);
                          const content = parts[i + 1]?.trim();

                          if (!isNaN(dayNum) && content) {
                            let dayEntry = result.find(d => d.day === dayNum);
                            if (!dayEntry) {
                              dayEntry = { day: dayNum, activities: [] };
                              result.push(dayEntry);
                            }
                            dayEntry.activities.push({ time: periodName, content, color });
                          }
                        }
                      };

                      parsePeriod(schedule.morning, 'Sáng', 'amber');
                      parsePeriod(schedule.afternoon, 'Chiều', 'orange');
                      parsePeriod(schedule.evening, 'Tối', 'indigo');

                      // Sort by day number
                      result.sort((a, b) => a.day - b.day);

                      return result.length > 0 ? result : [{
                        day: 1,
                        activities: [
                          schedule.morning ? { time: 'Sáng', content: schedule.morning, color: 'amber' } : null,
                          schedule.afternoon ? { time: 'Chiều', content: schedule.afternoon, color: 'orange' } : null,
                          schedule.evening ? { time: 'Tối', content: schedule.evening, color: 'indigo' } : null
                        ].filter(Boolean)
                      }];
                    };

                    const scheduleByDay = parseScheduleByDay();
                    const timeIcons: Record<string, React.ReactNode> = {
                      'Sáng': <Sun className="w-4 h-4" />,
                      'Chiều': <Sunset className="w-4 h-4" />,
                      'Tối': <Moon className="w-4 h-4" />
                    };
                    const colorClasses: Record<string, { bg: string; border: string; iconBg: string; text: string }> = {
                      'amber': { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100', text: 'text-amber-600' },
                      'orange': { bg: 'bg-orange-50', border: 'border-orange-200', iconBg: 'bg-orange-100', text: 'text-orange-600' },
                      'indigo': { bg: 'bg-indigo-50', border: 'border-indigo-200', iconBg: 'bg-indigo-100', text: 'text-indigo-600' }
                    };

                    return (
                      <div className="space-y-6">
                        {scheduleByDay.map((dayData: any) => (
                          <div key={dayData.day} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
                            {/* Day Header */}
                            <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-3">
                              <h4 className="text-white font-bold text-lg">📅 Ngày {dayData.day}</h4>
                            </div>

                            {/* Activities */}
                            <div className="p-4 space-y-3">
                              {dayData.activities.map((activity: any, idx: number) => {
                                const colors = colorClasses[activity.color] || colorClasses.amber;
                                return (
                                  <div key={idx} className={`flex gap-3 p-3 ${colors.bg} rounded-xl border ${colors.border}`}>
                                    <div className={`flex-shrink-0 p-2 ${colors.iconBg} rounded-full ${colors.text}`}>
                                      {timeIcons[activity.time]}
                                    </div>
                                    <div className="flex-1">
                                      <span className={`font-semibold ${colors.text} text-sm`}>{activity.time}</span>
                                      <p className="text-gray-700 text-sm mt-1 leading-relaxed">{activity.content}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Includes / Excludes */}
              {(inclusions.length > 0 || exclusions.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {inclusions.length > 0 && (
                    <div className="p-5 bg-green-50 rounded-2xl border border-green-200">
                      <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Bao gồm
                      </h4>
                      <ul className="space-y-2">
                        {inclusions.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exclusions.length > 0 && (
                    <div className="p-5 bg-red-50 rounded-2xl border border-red-200">
                      <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                        <X className="w-5 h-5" />
                        Không bao gồm
                      </h4>
                      <ul className="space-y-2">
                        {exclusions.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tips */}
              {tips && (
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200">
                  <h4 className="font-bold text-blue-700 mb-2">💡 Mẹo hữu ích</h4>
                  <p className="text-gray-700">{tips}</p>
                </div>
              )}

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Đánh giá của khách hàng</h3>
                </div>

                {/* Review Form - Show only if eligible (booked & date passed & not reviewed) */}
                {user && canReview && (
                  <div className="mb-8 p-4 bg-gray-50 border border-blue-100 rounded-xl relative">
                    <div className="absolute top-0 right-0 p-2">
                      <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Bạn đã tham gia tour này</span>
                    </div>
                    <ReviewForm tourId={id!} onSuccess={() => {
                      refetch(); // Reload reviews
                      setCanReview(false); // Hide form after success
                    }} />
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((r: any) => (
                      <div key={r._id} className="p-4 bg-white rounded-xl border shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                            {(r.user?.name || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{r.user?.name || 'Ẩn danh'}</h4>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(r.createdAt || Date.now()), "dd/MM/yyyy", { locale: vi })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <StarRating rating={r.rating} />
                              <span className="text-sm font-medium">{r.rating}/5</span>
                            </div>
                            <p className="text-sm text-gray-600">{r.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
                )}
              </div>
            </div>

            {/* Right: Booking Box */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-white rounded-2xl border-2 p-6 shadow-xl">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {price.toLocaleString('vi-VN')}₫
                  </div>
                  <p className="text-muted-foreground">mỗi người</p>
                </div>

                {/* Date Picker */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Chọn ngày</label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left h-12 rounded-xl">
                        <CalendarIcon className="mr-2 w-5 h-5" />
                        {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => { setSelectedDate(date); setIsDatePickerOpen(false); }}
                        disabled={(date) => {
                          const now = new Date();
                          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                          // Disable past days
                          if (date < today) return true;

                          // Disable today if it's past 08:00
                          if (date.getTime() === today.getTime() && now.getHours() >= 8) {
                            return true;
                          }

                          // Check against start_dates
                          const startDates = (tour as any)?.start_dates || [];
                          if (startDates.length > 0) {
                            const dateString = format(date, 'yyyy-MM-dd');
                            const isAvailable = startDates.some((sd: string | Date) => {
                              return format(new Date(sd), 'yyyy-MM-dd') === dateString;
                            });
                            return !isAvailable;
                          }

                          return false;
                        }}
                        locale={vi}
                        classNames={{
                          day_selected: "bg-orange-600 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-600 focus:text-white"
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Quantity */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Số lượng khách</label>

                    {/* Availability Status */}
                    {isCheckingAvailability ? (
                      <span className="text-xs text-muted-foreground animate-pulse">Đang kiểm tra chỗ...</span>
                    ) : selectedDate ? (
                      availability ? (
                        <span className={`text-xs font-medium ${availability.available <= 0 ? 'text-red-500' :
                          availability.available < 5 ? 'text-orange-500' : 'text-green-600'
                          }`}>
                          {availability.available <= 0 ? 'Đã hết chỗ' : `Còn ${availability.available} chỗ`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Chọn ngày để xem chỗ</span>
                      )
                    ) : (
                      <span className={`text-xs text-xs font-medium ${(tour?.maxGroupSize || 0) <= 0 ? 'text-red-500' :
                        (tour?.maxGroupSize || 0) < 5 ? 'text-orange-500' : 'text-green-600'
                        }`}>
                        {/* Fallback to maxGroupSize if no date selected, though technically we want to force date selection */}
                        {(tour?.maxGroupSize || 0) <= 0 ? 'Đã hết chỗ' : `Tổng ${tour?.maxGroupSize || 0} chỗ`}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Người lớn</label>
                      <div className="flex items-center border rounded-xl h-12">
                        <button onClick={() => setAdults(Math.max(1, adults - 1))} className="px-4 h-full hover:bg-gray-50">-</button>
                        <span className="flex-1 text-center font-medium">{adults}</span>
                        <button onClick={() => setAdults(adults + 1)} className="px-4 h-full hover:bg-gray-50">+</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Trẻ em</label>
                      <div className="flex items-center border rounded-xl h-12">
                        <button onClick={() => setChildren(Math.max(0, children - 1))} className="px-4 h-full hover:bg-gray-50">-</button>
                        <span className="flex-1 text-center font-medium">{children}</span>
                        <button onClick={() => setChildren(children + 1)} className="px-4 h-full hover:bg-gray-50">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Over Capacity Warning */}
                  {selectedDate && availability && (adults + children > availability.available) && availability.available > 0 && (
                    <p className="text-xs text-red-500 mt-2">
                      Số lượng khách vượt quá số chỗ còn lại ({availability.available}).
                    </p>
                  )}
                  {/* Fallback Warning */}
                  {!selectedDate && (adults + children > (tour?.maxGroupSize || 0)) && (tour?.maxGroupSize || 0) > 0 && (
                    <p className="text-xs text-red-500 mt-2">
                      Số lượng khách vượt quá tổng số chỗ ({tour?.maxGroupSize}).
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mb-6 py-4 border-t border-b">
                  <span className="font-medium">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString('vi-VN')}₫</span>
                </div>

                {/* Book Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                  onClick={() => setShowConfirm(true)}
                  disabled={
                    !selectedDate ||
                    isCheckingAvailability ||
                    (availability && availability.available <= 0) ||
                    (availability && (adults + children > availability.available)) ||
                    (!availability && (tour?.maxGroupSize || 0) <= 0) // Fallback
                  }
                >
                  {isCheckingAvailability ? 'Đang kiểm tra...' :
                    (availability && availability.available <= 0) ? 'Hết chỗ ngày này' :
                      ((tour?.maxGroupSize || 0) <= 0 && !selectedDate) ? 'Hết chỗ' : 'Đặt ngay'}
                  {!isCheckingAvailability && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>

                {!selectedDate && (tour?.maxGroupSize || 0) > 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-3">Vui lòng chọn ngày để đặt tour</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExperienceDetail;
