import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter } from 'lucide-react';

export type FlightFilters = {
  maxPrice: number;
  selectedStops: number[]; // e.g., [0,1]
  selectedAirlines: string[]; // names
  classTypes: string[]; // ['Economy','Business']
};

type Props = {
  filters: FlightFilters;
  onPriceChange: (maxPrice: number) => void;
  onToggleStop: (stops: number) => void;
  onToggleAirline: (airline: string) => void;
  onToggleClass: (cls: string) => void;
  allAirlines: string[];
};

const stopOptions = [0, 1];
const classOptions = ['Economy', 'Business'];

const FilterSidebar = ({ filters, onPriceChange, onToggleStop, onToggleAirline, onToggleClass, allAirlines }: Props) => {
  return (
    <aside className="w-full lg:w-1/4 sticky top-24 h-fit">
      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5" />
          <h2 className="text-xl font-bold">Bộ lọc</h2>
        </div>

        {/* Price */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Giá tối đa</h3>
          <Slider value={[filters.maxPrice]} onValueChange={(v) => onPriceChange(v[0])} max={5000000} step={50000} />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>0₫</span>
            <span>{filters.maxPrice.toLocaleString()}₫</span>
          </div>
        </div>

        {/* Stops */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Điểm dừng</h3>
          <div className="space-y-2">
            {stopOptions.map((opt) => (
              <label key={opt} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox checked={filters.selectedStops.includes(opt)} onCheckedChange={() => onToggleStop(opt)} />
                <span className="text-sm">{opt === 0 ? 'Bay thẳng' : `${opt} điểm dừng`}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Airlines */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Hãng bay</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {allAirlines.map((airline) => (
              <label key={airline} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox checked={filters.selectedAirlines.includes(airline)} onCheckedChange={() => onToggleAirline(airline)} />
                <span className="text-sm">{airline}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Class */}
        <div className="mb-2">
          <h3 className="font-semibold mb-3">Hạng vé</h3>
          <div className="space-y-2">
            {classOptions.map((cls) => (
              <label key={cls} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox checked={filters.classTypes.includes(cls)} onCheckedChange={() => onToggleClass(cls)} />
                <span className="text-sm">{cls}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;


