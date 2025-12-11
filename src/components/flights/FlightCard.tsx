import { IFlight } from '@/data/mockFlights';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { ArrowRight, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';

const airlineLogoMap: Record<IFlight['airline'], string> = {
  'Vietnam Airlines': 'https://picsum.photos/seed/vna/120/120',
  'VietJet Air': 'https://picsum.photos/seed/vja/120/120',
  'Bamboo Airways': 'https://picsum.photos/seed/bamboo/120/120',
};

const FlightCard = ({ flight }: { flight: IFlight }) => {
  return (
    <article className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        <div className="w-14 h-14">
          <ResilientImage src={airlineLogoMap[flight.airline]} alt={flight.airline} className="w-14 h-14 object-contain rounded" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{flight.airline} • {flight.flightNumber}</div>
            <div className="text-2xl font-bold text-primary">{flight.price.toLocaleString()}₫</div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <div className="font-semibold text-lg">{flight.departureTime}</div>
            <ArrowRight className="w-4 h-4" />
            <div className="font-semibold text-lg">{flight.arrivalTime}</div>
            <span className="text-muted-foreground">{flight.duration}</span>
            <span className="text-muted-foreground">{flight.stops === 0 ? 'Bay thẳng' : `${flight.stops} điểm dừng`}</span>
            <span className="text-muted-foreground hidden sm:inline">{flight.class}</span>
          </div>
          <div className="mt-1 text-muted-foreground text-sm">
            {flight.origin.city} ({flight.origin.code}) <Plane className="inline w-3 h-3" /> {flight.destination.city} ({flight.destination.code})
          </div>
        </div>
        <div>
          <Button size="sm">Chọn</Button>
        </div>
      </div>
    </article>
  );
};

export default FlightCard;


