import SkeletonCard from "@/components/ui/SkeletonCard";
import TourCard from "@/components/cards/TourCard";
import type { ITour } from "@/types/models";

interface UniqueExperiencesProps {
  tours: ITour[];
  isLoading: boolean;
}

export const UniqueExperiences = ({ tours, isLoading }: UniqueExperiencesProps) => {
  return (
    <section id="experiences" className="py-10 md:py-20" aria-label="Tours và Trải Nghiệm Độc Đáo">
      <div className="container mx-auto px-3">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6">Tours và Trải Nghiệm Độc Đáo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : tours.map((tour) => <TourCard key={tour._id} tour={tour} />)
          }
        </div>
      </div>
    </section>
  );
};

export default UniqueExperiences;
