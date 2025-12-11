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

interface JourneyItem {
  _id: string;
  status: string;
  bookingDate: string;
  participants: number;
  totalPrice: number;
  tour: JourneyTour | null;
}

interface JourneyCardProps {
  journey: JourneyItem;
}

const JourneyCard = ({ journey }: JourneyCardProps) => {
  const { t } = useTranslation();

  return (
    <Link to={`/dashboard/bookings/${journey._id}`}>
      <Card className="hover:shadow-md transition-shadow overflow-hidden text-left">
        {journey.tour?.mainImage && (
          <ResilientImage src={journey.tour.mainImage} alt={journey.tour.title} className="w-full h-40 object-cover" />
        )}
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{journey.tour?.destination?.name || 'Không rõ điểm đến'}</p>
            <CardTitle className="text-lg">{journey.tour?.title || 'Tour'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Ngày đi: {formatDate(journey.bookingDate)}</p>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{translateStatus(journey.status, t)}</Badge>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {journey.participants} người
                </p>
                <p className="text-sm font-medium">
                  {formatCurrencyVND(journey.totalPrice)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default JourneyCard;

