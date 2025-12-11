import { Skeleton } from "@/components/ui/skeleton";
import type { IDestination } from "@/types/models";
import DestinationCard from "@/components/cards/DestinationCard";

interface FeaturedDestinationsProps {
  destinations: IDestination[];
  isLoading: boolean;
}

export const FeaturedDestinations = ({ destinations, isLoading }: FeaturedDestinationsProps) => {
  return (
    <section id="destinations" className="py-16 md:py-20" aria-label="Điểm Đến Nổi Bật">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6">Điểm Đến Nổi Bật</h2>

        <div className="hidden md:grid grid-cols-2 lg:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="relative overflow-hidden rounded-xl border bg-card">
                  <Skeleton className="h-80 w-full" />
                </div>
              ))
            : destinations.map((d) => (
                <DestinationCard key={d._id} destination={d} />
              ))}
        </div>

        <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="relative min-w-[70%] snap-center overflow-hidden rounded-xl border bg-card">
                  <Skeleton className="h-80 w-full" />
                </div>
              ))
            : destinations.map((d) => (
                <div key={d._id} className="min-w-[70%] snap-center">
                  <DestinationCard destination={d} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDestinations;
