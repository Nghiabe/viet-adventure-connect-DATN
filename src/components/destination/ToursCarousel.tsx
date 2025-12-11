import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface TourItem {
  id: string;
  title: string;
  image: string;
  location: string;
  duration: string;
  rating: number;
  reviewCount: number;
  price: string;
  sustainable?: boolean;
}

export function ToursCarousel({ tours, destinationName }: { tours: TourItem[]; destinationName: string }) {
  if (!tours?.length) return null;
  return (
    <section className="w-full">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-bold">Trải nghiệm tại {destinationName}</h2>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/tours/search?destination=${encodeURIComponent(destinationName)}`}>Xem tất cả</Link>
        </Button>
      </div>
      <Carousel>
        <CarouselContent>
          {tours.map((t) => (
            <CarouselItem key={t.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="rounded-xl overflow-hidden border bg-card">
                <img src={t.image} alt={t.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">{t.location} • {t.duration}</div>
                  <div className="font-semibold line-clamp-2 mb-2">{t.title}</div>
                  <div className="text-primary font-bold">{t.price}₫</div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}


