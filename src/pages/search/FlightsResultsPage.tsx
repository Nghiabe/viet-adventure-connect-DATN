import { Header } from '@/components/home/Header';
import { useToast } from '@/components/ui/use-toast';
import { Footer } from '@/components/home/Footer';
import { useMemo, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FilterSidebar, { FlightFilters } from '@/components/flights/FilterSidebar';
import FlightCard from '@/components/flights/FlightCard';
import FlightCardSkeleton from '@/components/flights/FlightCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IFlight, mockFlights } from '@/data/mockFlights';
import { useBooking, PreBookingDetails } from '@/context/BookingContext';
import { airlineLogoMap } from '@/components/flights/FlightCard';

type SortBy = 'relevance' | 'price_asc' | 'price_desc' | 'departure_asc';
const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'relevance', label: 'Phù hợp nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'departure_asc', label: 'Cất cánh sớm nhất' },
];

const PAGE_SIZE = 12;

const FlightsResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { initiateBooking } = useBooking();
  const [isLoading, setIsLoading] = useState(true);
  const [filteredFlights, setFilteredFlights] = useState<IFlight[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  // Initial criteria from homepage
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';

  // URL-driven filters
  const maxPrice = parseInt(searchParams.get('maxPrice') || '5000000', 10);
  const stopsParam = searchParams.get('stops'); // e.g., "0,1"
  const airlinesParam = searchParams.get('airlines'); // names
  const classesParam = searchParams.get('classes'); // e.g., "Economy,Business"
  const sortBy = (searchParams.get('sortBy') as SortBy) || 'relevance';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const selectedStops = stopsParam ? stopsParam.split(',').map(s => parseInt(s, 10)) : [];
  const selectedAirlines = airlinesParam ? airlinesParam.split(',') : [];
  const classTypes = classesParam ? classesParam.split(',') : [];

  const allAirlines = useMemo(() => Array.from(new Set(mockFlights.map(f => f.airline))), []);

  const filters: FlightFilters = {
    maxPrice,
    selectedStops,
    selectedAirlines,
    classTypes,
  };

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k); else next.set(k, String(v));
    });
    if (!('page' in updates)) next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  // Handlers
  const handlePriceChange = (value: number) => updateParams({ maxPrice: value });
  const handleToggleStop = (stops: number) => {
    const set = new Set(selectedStops);
    if (set.has(stops)) set.delete(stops); else set.add(stops);
    const v = Array.from(set).sort((a, b) => a - b).join(',');
    updateParams({ stops: v || undefined });
  };
  const handleToggleAirline = (airline: string) => {
    const set = new Set(selectedAirlines);
    if (set.has(airline)) set.delete(airline); else set.add(airline);
    const v = Array.from(set).sort().join(',');
    updateParams({ airlines: v || undefined });
  };
  const handleToggleClass = (cls: string) => {
    const set = new Set(classTypes);
    if (set.has(cls)) set.delete(cls); else set.add(cls);
    const v = Array.from(set).sort().join(',');
    updateParams({ classes: v || undefined });
  };
  const handleSortChange = (v: SortBy) => updateParams({ sortBy: v });
  const handlePageChange = (p: number) => updateParams({ page: p });

  // Async fetch from API
  useEffect(() => {
    const fetchFlights = async () => {
      setIsLoading(true);
      try {
        // Construct query parameters
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        if (date) params.append('date', date);
        if (maxPrice) params.append('maxPrice', maxPrice.toString());
        if (selectedStops.length > 0) params.append('stops', selectedStops.join(','));
        if (selectedAirlines.length > 0) params.append('airlines', selectedAirlines.join(','));
        if (classTypes.length > 0) params.append('classes', classTypes.join(','));
        params.append('sortBy', sortBy);
        params.append('page', page.toString()); // Backend implementation expects page

        // Import apiClient dynamically to avoid top-level issues if any, or just standard import
        const { default: apiClient } = await import('@/services/apiClient');

        const response = await apiClient.get<any>(`/flights?${params.toString()}`);

        if (response.success && response.data) {
          setFilteredFlights(response.data);
          setTotalResults((response as any).total || 0);
        } else {
          setFilteredFlights([]);
          setTotalResults(0);
        }
      } catch (error) {
        console.error("Failed to fetch flights", error);
        // Fallback or empty
        setFilteredFlights([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlights();
  }, [from, to, date, maxPrice, selectedStops.join(','), selectedAirlines.join(','), classTypes.join(','), sortBy, page]);

  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const handleClearFilters = () => setSearchParams(new URLSearchParams({ from, to, date }), { replace: true });

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <FilterSidebar
              filters={{ maxPrice, selectedStops, selectedAirlines, classTypes }}
              onPriceChange={handlePriceChange}
              onToggleStop={handleToggleStop}
              onToggleAirline={handleToggleAirline}
              onToggleClass={handleToggleClass}
              allAirlines={allAirlines}
            />

            <section className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Kết quả chuyến bay</h1>
                  {!isLoading && (
                    <p className="text-muted-foreground">Hiển thị {filteredFlights.length} trong tổng số {totalResults} kết quả</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sắp xếp:</span>
                  <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortBy)}>
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <FlightCardSkeleton key={i} />
                  ))}
                </div>
              ) : totalResults === 0 ? (
                <EmptyState
                  title="Không tìm thấy chuyến bay nào phù hợp"
                  message="Hãy điều chỉnh bộ lọc hoặc xóa tất cả bộ lọc để xem tất cả."
                  showClearFilters={true}
                  onClearFilters={handleClearFilters}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
                    {filteredFlights.map(flight => (
                      <FlightCard
                        key={flight.id}
                        flight={flight}
                        onSelect={(f) => {
                          const details: PreBookingDetails = {
                            type: 'flight',
                            title: `Vé máy bay ${f.origin.city} - ${f.destination.city}`,
                            unitPrice: f.price,
                            clientComputedTotal: f.price, // Start with 1 pax
                            participantsTotal: 1,
                            image: airlineLogoMap[f.airline],
                            airline: f.airline,
                            flightNumber: f.flightNumber,
                            origin: { ...f.origin, time: f.departureTime },
                            destination: { ...f.destination, time: f.arrivalTime },
                            duration: f.duration,
                            stops: f.stops,
                            class: f.class,
                            bookingDate: date || new Date().toISOString()
                          };
                          initiateBooking(details);
                          navigate('/checkout');
                        }}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-center">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>Trước</Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          if (totalPages <= 5) return i + 1;
                          if (page <= 3) return i + 1;
                          if (page >= totalPages - 2) return totalPages - 4 + i + 1;
                          return page - 2 + i;
                        }).map((p) => (
                          <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" onClick={() => handlePageChange(Number(p))}>{p}</Button>
                        ))}
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>Sau</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FlightsResultsPage;


