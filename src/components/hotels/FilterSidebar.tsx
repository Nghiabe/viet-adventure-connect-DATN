import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter } from 'lucide-react';

export type HotelFilters = {
  minPrice: number;
  maxPrice: number;
  selectedRatings: number[]; // e.g., [4,5]
  selectedAmenities: string[];
};

type FilterSidebarProps = {
  filters: HotelFilters;
  onPriceChange: (range: number[]) => void;
  onToggleRating: (rating: number) => void;
  onToggleAmenity: (amenity: string) => void;
  allAmenities: string[];
};

const ratingOptions = [5, 4, 3, 2, 1];

const FilterSidebar = ({ filters, onPriceChange, onToggleRating, onToggleAmenity, allAmenities }: FilterSidebarProps) => {
  return (
    <aside className="w-full lg:w-1/4 sticky top-24 h-fit">
      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5" />
          <h2 className="text-xl font-bold">Bộ lọc</h2>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Khoảng giá</h3>
          <Slider
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={onPriceChange}
            max={15000000}
            step={100000}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{filters.minPrice.toLocaleString()}₫</span>
            <span>{filters.maxPrice.toLocaleString()}₫</span>
          </div>
        </div>

        {/* Ratings */}
      <div className="mb-6">
          <h3 className="font-semibold mb-3">Đánh giá</h3>
          <div className="space-y-2">
            {ratingOptions.map((rating) => (
              <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.selectedRatings.includes(rating)}
                  onCheckedChange={() => onToggleRating(rating)}
                />
                <span className="text-sm">{rating} sao & hơn</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-2">
          <h3 className="font-semibold mb-3">Tiện nghi</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {allAmenities.map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.selectedAmenities.includes(amenity)}
                  onCheckedChange={() => onToggleAmenity(amenity)}
                />
                <span className="text-sm capitalize">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;


