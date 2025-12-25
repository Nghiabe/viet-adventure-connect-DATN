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
              <span className="text-muted-foreground">Ngày đặt:</span>
              <span className="font-medium">{formatDate(journey.bookingDate)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                <span>👥 {journey.participants} khách</span>
              </div>
              <p className="text-base font-bold text-primary">
                {formatCurrencyVND(journey.totalPrice)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default JourneyCard;

