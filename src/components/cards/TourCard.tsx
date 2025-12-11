/**
 * TourCard component for displaying tour previews.
 * Used in ToursSearch page and Homepage UniqueExperiences section.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Navigation, Heart } from 'lucide-react';
import { ITour } from '@/types/models';
import { getCategoryInfo } from '@/lib/tourConfig';
import { getTourImageUrl, formatPriceVND } from '@/lib/tourUtils';
import { GradientPlaceholder } from '@/components/ui/GradientPlaceholder';

interface TourCardProps {
  tour: ITour;
}

export default function TourCard({ tour }: TourCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get tour data with safe fallbacks
  const destinationName = !tour.destination
    ? (tour as any).location || ''
    : typeof tour.destination === 'string'
      ? tour.destination
      : tour.destination?.name || '';

  const category = (tour as any).category || 'tham_quan';
  const catConfig = getCategoryInfo(category);
  const imageUrl = getTourImageUrl(tour as any);
  const hasValidImage = imageUrl && !imageError;
  const route = (tour as any).route || '';
  const highlights: string[] = (tour as any).highlights || [];

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  return (
    <Link
      to={`/experience/${tour._id}`}
      className="group block bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100"
    >
      {/* Image Section */}
      <div className="relative h-52 overflow-hidden">
        {hasValidImage ? (
          <img
            src={imageUrl}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <GradientPlaceholder category={category} title={tour.title} size="md" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg hover:scale-110"
          aria-label={isFavorited ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>

        {/* Destination badge */}
        {destinationName && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm">
            <MapPin className="w-3 h-3" />
            {destinationName}
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm">
          <Clock className="w-3.5 h-3.5" />
          {tour.duration}
        </div>

        {/* Sustainable badge */}
        {tour.isSustainable && (
          <div className="absolute bottom-3 left-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-lg">
            🌿 Bền vững
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[56px]">
          {tour.title}
        </h3>

        {/* Route Preview */}
        {route && (
          <div className="mb-3 p-2.5 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-start gap-2">
              <Navigation className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-700 line-clamp-2">{route}</p>
            </div>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {highlights.slice(0, 2).map((h, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                • {h.length > 25 ? `${h.slice(0, 25)}...` : h}
              </span>
            ))}
          </div>
        )}

        {/* Rating & Price */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{(tour.averageRating ?? 0).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({tour.reviewCount ?? 0})</span>
          </div>

          <div className="text-right">
            <div className="font-bold text-lg text-primary">
              {formatPriceVND(tour.price)}
            </div>
            <div className="text-xs text-muted-foreground">/người</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
