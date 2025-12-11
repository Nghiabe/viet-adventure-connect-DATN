import { Calendar } from 'lucide-react';
import JourneyCard from './JourneyCard';

export interface JourneyDestination {
  _id: string;
  name: string;
}

export interface JourneyTour {
  _id: string;
  title: string;
  mainImage?: string | null;
  slug?: string;
  destination?: JourneyDestination | null;
}

export interface JourneyItem {
  _id: string;
  status: string;
  bookingDate: string;
  participants: number;
  totalPrice: number;
  tour: JourneyTour | null;
}

interface JourneysTabProps {
  journeys: JourneyItem[];
}

const JourneysTab = ({ journeys }: JourneysTabProps) => {
  if (!journeys || journeys.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Chuyến đi của tôi</h3>
        <p className="text-muted-foreground mb-6">
          Xem lại những chuyến đi đã trải qua và lên kế hoạch cho những cuộc phiêu lưu tiếp theo
        </p>
        <p className="text-muted-foreground">
          Bạn chưa có chuyến đi nào. Hãy đặt tour đầu tiên để bắt đầu hành trình khám phá!
        </p>
      </div>
    );
  }

  const upcoming = journeys.filter((j) => j.status === 'confirmed' || j.status === 'pending');
  const past = journeys.filter((j) => j.status === 'completed' || j.status === 'cancelled');
  const others = journeys.filter((j) => !['confirmed', 'pending', 'completed', 'cancelled'].includes(j.status));

  return (
    <div className="space-y-8 py-2">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Chuyến đi Sắp tới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((j) => (
              <JourneyCard key={j._id} journey={j as any} />
            ))}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Lịch sử Chuyến đi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map((j) => (
              <JourneyCard key={j._id} journey={j as any} />
            ))}
          </div>
        </div>
      )}
      {others.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Khác</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((j) => (
              <JourneyCard key={j._id} journey={j as any} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneysTab;
