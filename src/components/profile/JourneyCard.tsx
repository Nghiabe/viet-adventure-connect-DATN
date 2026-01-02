import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyVND } from "@/utils/format";
import { ResilientImage } from "@/components/ui/ResilientImage";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plane, Hotel, Bus, Train, MapPin, CalendarDays, Ticket } from "lucide-react";

interface JourneyItem {
  _id: string;
  status: string;
  bookingDate: string;
  participants: number;
  totalPrice: number;
  items?: any;
  tour?: any;
  partnerService?: any;
  tourTitle?: string;
  mainImage?: string;
  destination?: string;
  type?: string; // 'tour', 'hotel', 'flight', 'train', 'bus'
  checkInDate?: string;
  serviceInfo?: any; // Add serviceInfo to interface if needed
}

interface JourneyCardProps {
  journey: JourneyItem;
}

const JourneyCard = ({ journey }: JourneyCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 1. Determine Title & Type
  // PRIORITY: serviceInfo snapshot (Original Data) > References > Fallback
  let title = journey.serviceInfo?.title || journey.tourTitle || journey.tour?.title || journey.partnerService?.name || '';
  const type = journey.type || 'tour';

  if (!title) {
    if (type === 'hotel') title = 'Đặt phòng khách sạn';
    else if (type === 'flight') title = 'Vé máy bay';
    else if (type === 'train') title = 'Vé tàu hỏa';
    else if (type === 'bus') title = 'Vé xe khách';
    else title = 'Dịch vụ du lịch';
  }

  // 2. Determine Image
  let image = journey.serviceInfo?.image || journey.mainImage ||
    journey.tour?.mainImage ||
    journey.partnerService?.image ||
    (journey.partnerService?.images && journey.partnerService.images[0]);

  // Fallback images based on type
  if (!image) {
    if (type === 'hotel') image = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop';
    else if (type === 'flight') image = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600&auto=format&fit=crop';
    else if (type === 'train') image = 'https://images.unsplash.com/photo-1474487548417-781cb714d225?q=80&w=600&auto=format&fit=crop';
    else if (type === 'bus') image = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=600&auto=format&fit=crop';
    else image = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop'; // General travel
  }

  // 3. Determine Location / Subtext
  const location = journey.destination || journey.tour?.destination?.name || '';
  let subText = location;
  if (!subText) {
    if (type === 'hotel') subText = 'Lưu trú';
    else if (type === 'flight') subText = 'Di chuyển hàng không';
    else subText = 'Trải nghiệm';
  }

  // Time Logic
  const checkInDate = journey.checkInDate ? new Date(journey.checkInDate) : new Date(journey.bookingDate);
  const isPast = new Date() >= checkInDate;

  // Cancellation Deadline: 24h before CheckIn
  const cancelDeadline = new Date(checkInDate);
  cancelDeadline.setDate(cancelDeadline.getDate() - 1);
  const canCancel = new Date() < cancelDeadline;

  // Review Eligibility: Trip Started OR Completed
  const canReview = isPast || journey.status === 'completed';

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      'pending': 'Chờ duyệt',
      'confirmed': 'Đã xác nhận',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'provisional': 'Chờ thanh toán',
      'refunded': 'Đã hoàn tiền'
    };
    return map[s] || s;
  };

  const getStatusColor = (s: string) => {
    if (['confirmed', 'completed'].includes(s)) return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (['cancelled', 'refunded'].includes(s)) return 'bg-red-100 text-red-800 hover:bg-red-200';
    return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'tour': return <MapPin className="w-4 h-4" />;
      case 'hotel': return <Hotel className="w-4 h-4" />;
      case 'flight': return <Plane className="w-4 h-4" />;
      case 'train': return <Train className="w-4 h-4" />;
      case 'bus': return <Bus className="w-4 h-4" />;
      default: return <Ticket className="w-4 h-4" />;
    }
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow overflow-hidden text-left h-full flex flex-col group cursor-pointer"
      onClick={() => navigate(`/profile/bookings/${journey._id}`)}
    >
      <div className="relative h-40 overflow-hidden">
        <ResilientImage
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className={`absolute top-2 right-2 ${getStatusColor(journey.status)} border-none`}>
          {getStatusLabel(journey.status)}
        </Badge>
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          {getTypeIcon()}
          <span className="capitalize">{type === 'tour' ? 'Tour' : type}</span>
        </div>
      </div>

      <CardHeader className="pb-2 flex-1">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            {subText}
          </p>
          <CardTitle className="text-lg font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="h-px bg-border w-full" />

          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Ngày đặt:
            </span>
            <span>{new Date((journey as any).bookingDate).toLocaleDateString("vi-VN")}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              <span>👥 {journey.participants} khách</span>
            </div>
            <p className="text-base font-bold text-primary">
              {formatCurrencyVND(journey.totalPrice)}
            </p>
          </div>

          {/* Actions: Cancel */}
          {['pending', 'confirmed'].includes(journey.status) && canCancel && (
            <div onClick={(e) => e.stopPropagation()}>
              <div className="pt-2 border-t mt-2">
                <CancelButton id={journey._id} />
              </div>
            </div>
          )}

          {/* Actions: Review */}
          {['confirmed', 'completed'].includes(journey.status) && canReview && (
            <div onClick={(e) => e.stopPropagation()}>
              <div className="pt-2 border-t mt-2">
                {(() => {
                  const tourId = journey.tour?._id || (typeof journey.tour === 'string' ? journey.tour : null);
                  if (tourId && (!journey.type || journey.type === 'tour')) {
                    return (
                      <Link to={`/write-review/${tourId}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs h-8 border-primary text-primary hover:bg-primary hover:text-white">
                          Viết đánh giá
                        </Button>
                      </Link>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Extracted for cleaner logic and to avoid Link click conflict
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import { useState } from "react";

const CancelButton = ({ id }: { id: string }) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop Link navigation

    if (!confirm('Bạn có chắc chắn muốn hủy đơn này không?')) return;

    setLoading(true);
    try {
      const res = await apiClient.put(`/bookings/${id}/cancel`, {});
      if ((res as any).success) {
        toast.success('Hủy đơn thành công');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error((res as any).error || 'Lỗi khi hủy đơn');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      className="w-full text-xs h-8"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? 'Đang hủy...' : 'Hủy đơn'}
    </Button>
  )
}

export default JourneyCard;

