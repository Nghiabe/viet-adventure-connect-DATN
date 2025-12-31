import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyVND, formatDate } from "@/utils/format";
import { ResilientImage } from "@/components/ui/ResilientImage";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { translateStatus } from "@/utils/translation";

interface JourneyDestination {
  _id: string;
  name: string;
}

interface JourneyTour {
  _id: string;
  title: string;
  mainImage?: string | null;
  destination?: JourneyDestination | null;
}

// Update interface to match what backend sends in profiles
interface JourneyItem {
  _id: string;
  status: string;
  bookingDate: string;
  participants: number;
  totalPrice: number;
  // Flexible structure to handle both Tour object and flat fields
  items?: any;
  tour?: any;
  partnerService?: any;
  tourTitle?: string;
  mainImage?: string;
  destination?: string;
  type?: string;
  checkInDate?: string;
}

interface JourneyCardProps {
  journey: JourneyItem;
}

const JourneyCard = ({ journey }: JourneyCardProps) => {
  const { t } = useTranslation();

  // Normalize data access
  const title = journey.tourTitle || journey.tour?.title || journey.partnerService?.name || 'Dịch vụ';
  // Use a generic travel placeholder if image is missing
  const image = journey.mainImage ||
    journey.tour?.mainImage ||
    journey.partnerService?.image ||
    (journey.partnerService?.images && journey.partnerService.images[0]) ||
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop';
  const location = journey.destination || journey.tour?.destination?.name || (journey.type === 'hotel' ? 'Khách sạn' : 'Điểm đến khác');

  // Time Logic
  const checkInDate = journey.checkInDate ? new Date(journey.checkInDate) : new Date(journey.bookingDate); // Fallback to booking date if missing (unsafe but prevents crash)
  const isPast = new Date() >= checkInDate;

  // Cancellation Deadline: 24h before CheckIn
  const cancelDeadline = new Date(checkInDate);
  cancelDeadline.setDate(cancelDeadline.getDate() - 1);
  const canCancel = new Date() < cancelDeadline;

  // Review Eligibility: Trip Started OR Completed
  // NOTE: User requested "After deadline, cancel becomes review".
  const canReview = isPast || journey.status === 'completed';

  // Status Translation Helper
  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      'pending': 'Chờ duyệt',
      'confirmed': 'Đã xác nhận',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'provisional': 'Chờ thanh toán', // Assuming provisional means pending payment/confirmation
      'refunded': 'Đã hoàn tiền'
    };
    return map[s] || s;
  };

  const getStatusColor = (s: string) => {
    if (['confirmed', 'completed'].includes(s)) return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (['cancelled', 'refunded'].includes(s)) return 'bg-red-100 text-red-800 hover:bg-red-200';
    return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
  }

  return (
    <Link to={`/profile/bookings/${journey._id}`}>
      <Card className="hover:shadow-md transition-shadow overflow-hidden text-left h-full flex flex-col group">
        <div className="relative h-40 overflow-hidden">
          <ResilientImage
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Badge className={`absolute top-2 right-2 ${getStatusColor(journey.status)} border-none`}>
            {getStatusLabel(journey.status)}
          </Badge>
        </div>

        <CardHeader className="pb-2 flex-1">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              {location}
            </p>
            <CardTitle className="text-lg font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Divider */}
            <div className="h-px bg-border w-full" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Khởi hành:</span>
              <span className="font-medium text-primary">
                {formatDate(journey.checkInDate || journey.bookingDate)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                <span>👥 {journey.participants} khách</span>
              </div>
              <p className="text-base font-bold text-primary">
                {formatCurrencyVND(journey.totalPrice)}
              </p>
            </div>

            {/* Actions: Cancel (Before Deadline) */}
            {['pending', 'confirmed'].includes(journey.status) && canCancel && (
              <div onClick={(e) => e.preventDefault()}>
                <div className="pt-2 border-t mt-2">
                  <CancelButton id={journey._id} />
                </div>
              </div>
            )}

            {/* Actions: Review (After Trip Started or Completed) - IF NOT CANCELLED */}
            {['confirmed', 'completed'].includes(journey.status) && canReview && (
              <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <div className="pt-2 border-t mt-2">
                  {(() => {
                    // Safely get Tour ID
                    const tourId = journey.tour?._id || (typeof journey.tour === 'string' ? journey.tour : null);

                    // Only show Review button for Tours with valid ID
                    if (tourId && (!journey.type || journey.type === 'tour')) {
                      return (
                        <Link to={`/experience/${tourId}?review=true`} className="w-full">
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
    </Link>
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

