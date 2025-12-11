import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ResilientImage } from '@/components/ui/ResilientImage';

interface HeroImage {
  id: string;
  url: string;
  alt?: string;
}

interface DestinationHeroProps {
  images: HeroImage[];
  title: string;
  subtitle?: string;
}

export function DestinationHero({ images, title, subtitle }: DestinationHeroProps) {
  const validImages = Array.isArray(images) ? images.filter((i) => typeof i?.url === 'string' && !i.url.startsWith('blob:')) : [];
  const hasImages = validImages.length > 0;

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/80 via-background/20 to-transparent pointer-events-none" />
      {hasImages ? (
        <Carousel className="w-full">
          <CarouselContent>
            {validImages.map((img) => (
              <CarouselItem key={img.id}>
                <div className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden rounded-2xl">
                  <ResilientImage 
                    src={img.url}
                    alt={img.alt || title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-3 md:-left-6" />
          <CarouselNext className="-right-3 md:-right-6" />
        </Carousel>
      ) : (
        <div className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden rounded-2xl bg-muted">
          <ResilientImage src="/placeholder.svg" alt={title} className="w-full h-full object-cover opacity-70" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-20 flex items-end">
        <div className="container mx-auto px-4 pb-6 md:pb-10">
          <h1 className="text-white drop-shadow-lg text-3xl md:text-5xl font-bold mb-2">{title}</h1>
          {subtitle && (
            <p className="max-w-3xl text-white/90 drop-shadow text-base md:text-lg">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}


