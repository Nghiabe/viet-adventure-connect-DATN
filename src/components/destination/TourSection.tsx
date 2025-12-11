import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Clock, Star } from "lucide-react";

interface Tour {
  id: string;
  title: string;
  image: string;
  location: string;
  duration: string;
  rating: number;
  reviewCount: number;
  price: string;
  originalPrice?: string;
  category: string;
  highlights: string[];
  sustainable?: boolean;
}

interface TourSectionProps {
  tours: Tour[];
  destinationName: string;
}

// Reusable TourCard component matching the existing design system
const TourCard = ({ tour }: { tour: Tour }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <article className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className="relative">
        <img 
          src={tour.image} 
          alt={tour.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button 
          onClick={() => setIsFavorited(!isFavorited)}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
        {tour.sustainable && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
            Du lịch Bền vững
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
            {tour.category}
          </span>
        </div>
        
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{tour.title}</h3>
        
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
          <MapPin className="w-4 h-4" />
          <span>{tour.location}</span>
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <Clock className="w-4 h-4" />
          <span>{tour.duration}</span>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{tour.rating}</span>
          </div>
          <span className="text-muted-foreground text-sm">({tour.reviewCount} đánh giá)</span>
        </div>
        
        <div className="space-y-1 mb-4">
          {tour.highlights.map((highlight, index) => (
            <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
              {highlight}
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{tour.price}₫</span>
            {tour.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{tour.originalPrice}₫</span>
            )}
          </div>
          <Button size="sm" asChild>
            <Link to={`/experience/${tour.id}`}>Xem chi tiết</Link>
          </Button>
        </div>
      </div>
    </article>
  );
};

export const TourSection = ({ tours, destinationName }: TourSectionProps) => {
  if (!tours.length) return null;

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Tours & Trải Nghiệm Độc Đáo tại {destinationName}
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Khám phá những trải nghiệm tuyệt vời và tour du lịch được tuyển chọn kỹ lưỡng 
          để bạn có thể tận hưởng trọn vẹn vẻ đẹp của {destinationName}.
        </p>
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>

      {/* View All Tours Button */}
      <div className="text-center">
        <Button variant="outline" size="lg" asChild>
          <Link to={`/tours/search?destinationSlug=${destinationName.toLowerCase().replace(/\s+/g, '-')}`}>
            Xem tất cả tours tại {destinationName}
          </Link>
        </Button>
      </div>
    </section>
  );
};



