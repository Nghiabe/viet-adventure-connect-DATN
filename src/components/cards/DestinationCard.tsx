// src/components/cards/DestinationCard.tsx
import { Link } from 'react-router-dom';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { IDestination } from '@/types/models';

interface DestinationCardProps {
  destination: IDestination;
}

export default function DestinationCard({ destination }: DestinationCardProps) {
  const hasSlug = Boolean(destination.slug);
  const Wrapper: any = hasSlug ? Link : 'article';
  const wrapperProps = hasSlug ? { to: `/destinations/${destination.slug}` } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group block rounded-xl overflow-hidden shadow-lg transform transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className="relative">
        <ResilientImage
          src={destination.mainImage}
          alt={destination.name}
          className="w-full h-80 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white drop-shadow">{destination.name}</h3>
          {destination.bestTimeToVisit && (
            <p className="text-sm text-white/90 mt-1 drop-shadow">Thời gian tốt nhất: {destination.bestTimeToVisit}</p>
          )}
        </div>
      </div>
    </Wrapper>
  );
}












