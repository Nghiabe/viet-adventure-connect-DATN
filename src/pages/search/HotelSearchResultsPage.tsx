import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/home/Header';
import { Footer } from '@/components/home/Footer';
import FilterSidebar, { HotelFilters } from '@/components/hotels/FilterSidebar';
import HotelCard from '@/components/hotels/HotelCard';
import HotelCardSkeleton from '@/components/hotels/HotelCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { IHotel } from '@/types';

type SortBy = 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc';
const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'relevance', label: 'Phù hợp nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất' }
];
const PAGE_SIZE = 12;

const getAllAmenities = (hotels: IHotel[]): string[] => {
  const set = new Set<string>();
  hotels.forEach(h => h.amenities?.forEach(a => set.add(a)));
  return Array.from(set).sort();
};

const HotelSearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [allHotels, setAllHotels] = useState<IHotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<IHotel[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const isLoading = isFetching || isFiltering;
  const [fetchError, setFetchError] = useState<string | null>(null);

  // URL params
  const destination = searchParams.get('city') || searchParams.get('destination') || 'Da Nang';
  const minPrice = parseInt(searchParams.get('minPrice') || '0', 10);
  const maxPrice = parseInt(searchParams.get('maxPrice') || '15000000', 10);
  const ratingsParam = searchParams.get('ratings');
  const amenitiesParam = searchParams.get('amenities');
  const sortBy = (searchParams.get('sortBy') as SortBy) || 'relevance';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const selectedRatings = ratingsParam ? ratingsParam.split(',').map(r => parseInt(r, 10)) : [];
  const selectedAmenities = amenitiesParam ? amenitiesParam.split(',') : [];

  const allAmenities = useMemo(() => getAllAmenities(allHotels), [allHotels]);

  const filters: HotelFilters = {
    minPrice,
    maxPrice,
    selectedRatings,
    selectedAmenities,
  };

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) next.delete(k);
      else next.set(k, String(v));
    });
    if (!('page' in updates)) next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  // Handlers
  const handlePriceChange = (range: number[]) => updateParams({ minPrice: range[0], maxPrice: range[1] });
  const handleToggleRating = (rating: number) => {
    const set = new Set(selectedRatings);
    if (set.has(rating)) set.delete(rating); else set.add(rating);
    const value = Array.from(set).sort((a, b) => b - a).join(',');
    updateParams({ ratings: value || undefined });
  };
  const handleToggleAmenity = (amenity: string) => {
    const set = new Set(selectedAmenities);
    if (set.has(amenity)) set.delete(amenity); else set.add(amenity);
    const value = Array.from(set).sort().join(',');
    updateParams({ amenities: value || undefined });
  };
  const handleSortChange = (value: SortBy) => updateParams({ sortBy: value });
  const handlePageChange = (newPage: number) => updateParams({ page: newPage });
  const handleClearFilters = () => setSearchParams(new URLSearchParams(), { replace: true });

  // Fetch hotels from backend
  useEffect(() => {
    const controller = new AbortController();
    const fetchHotels = async () => {
      try {
        setFetchError(null);
        setIsFetching(true);

        const params = new URLSearchParams({ city: destination });
        // If your Vite proxy is configured properly, using relative path '/api/hotels' is fine.
        // If proxy not working, replace '/api/hotels' with 'http://localhost:4000/api/hotels'
        const url = `/api/hotels?${params.toString()}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          const txt = await res.text();
          console.error('Backend returned error:', res.status, txt);
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        setAllHotels(Array.isArray(data.hotels) ? data.hotels : (data.hotels ?? []));
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Fetch hotels error:', err);
        setFetchError(err.message || 'Có lỗi khi tải dữ liệu khách sạn');
        setAllHotels([]);
      } finally {
        setIsFetching(false);
      }
    };

    fetchHotels();
    return () => controller.abort();
  }, [destination]);

  // Filtering, sorting, pagination (client-side)
  useEffect(() => {
    setIsFiltering(true);
    const t = setTimeout(() => {
      let results: IHotel[] = Array.isArray(allHotels) ? [...allHotels] : [];

      // Price filter logic: prefer priceNumber, fallback to price.amount or min_total_price
      const DEFAULT_MAX = 15000000;
      const isPriceFilterActive = !(minPrice === 0 && maxPrice === DEFAULT_MAX);

      results = results.filter(h => {
        const raw = h as any;
        let priceVal: number | null = null;

        if (raw.priceNumber != null) {
          const n = Number(raw.priceNumber);
          priceVal = Number.isFinite(n) ? n : null;
        } else if (raw.price && raw.price.amount) {
          const parsed = Number(String(raw.price.amount).replace(/[^0-9.-]+/g, ''));
          priceVal = Number.isFinite(parsed) ? parsed : null;
        } else if (raw.min_total_price != null) {
          const m = Number(raw.min_total_price);
          priceVal = Number.isFinite(m) ? m : null;
        }

        if (priceVal === null) {
          // keep unknown-price hotels if user didn't filter price
          return !isPriceFilterActive;
        }
        return priceVal >= minPrice && priceVal <= maxPrice;
      });

      // ratings filter
      if (selectedRatings.length > 0) {
        const minSelected = Math.min(...selectedRatings);
        results = results.filter(h => {
          const raw = h as any;
          const r = typeof raw.rating === 'number' ? raw.rating : (raw.rating?.score ?? 0);
          return (r ?? 0) >= minSelected;
        });
      }

      // amenities filter
      if (selectedAmenities.length > 0) {
        results = results.filter(h => {
          const list = (h.amenities ?? []) as string[];
          return selectedAmenities.every(a => list.includes(a));
        });
      }

      // sorting
      if (sortBy === 'price_asc') {
        results.sort((a, b) => {
          const pa = (a as any).priceNumber ?? Number.POSITIVE_INFINITY;
          const pb = (b as any).priceNumber ?? Number.POSITIVE_INFINITY;
          return Number(pa) - Number(pb);
        });
      } else if (sortBy === 'price_desc') {
        results.sort((a, b) => {
          const pa = (a as any).priceNumber ?? -1;
          const pb = (b as any).priceNumber ?? -1;
          return Number(pb) - Number(pa);
        });
      } else if (sortBy === 'rating_desc') {
        results.sort((a, b) => {
          const ra = typeof (a as any).rating === 'number' ? (a as any).rating : ((a as any).rating?.score ?? 0);
          const rb = typeof (b as any).rating === 'number' ? (b as any).rating : ((b as any).rating?.score ?? 0);
          return Number(rb) - Number(ra);
        });
      }

      // pagination slice
      const start = (page - 1) * PAGE_SIZE;
      const pageSlice = results.slice(start, start + PAGE_SIZE);

      // set filtered
      setFilteredHotels(pageSlice);
      setIsFiltering(false);
    }, 120); // small debounce

    return () => clearTimeout(t);
  }, [
    allHotels,
    minPrice,
    maxPrice,
    selectedRatings.join(','),
    selectedAmenities.join(','),
    sortBy,
    page
  ]);

  // Compute totalResults using the *same* filter logic (important so UI matches)
  const totalResults = useMemo(() => {
    let results: IHotel[] = Array.isArray(allHotels) ? [...allHotels] : [];

    const DEFAULT_MAX = 15000000;
    const isPriceFilterActive = !(minPrice === 0 && maxPrice === DEFAULT_MAX);

    results = results.filter(h => {
      const raw = h as any;
      let priceVal: number | null = null;
      if (raw.priceNumber != null) {
        const n = Number(raw.priceNumber);
        priceVal = Number.isFinite(n) ? n : null;
      } else if (raw.price && raw.price.amount) {
        const parsed = Number(String(raw.price.amount).replace(/[^0-9.-]+/g, ''));
        priceVal = Number.isFinite(parsed) ? parsed : null;
      } else if (raw.min_total_price != null) {
        const m = Number(raw.min_total_price);
        priceVal = Number.isFinite(m) ? m : null;
      }

      if (priceVal === null) return !isPriceFilterActive;
      return priceVal >= minPrice && priceVal <= maxPrice;
    });

    if (selectedRatings.length > 0) {
      const minSelected = Math.min(...selectedRatings);
      results = results.filter(h => {
        const raw = h as any;
        const r = typeof raw.rating === 'number' ? raw.rating : (raw.rating?.score ?? 0);
        return (r ?? 0) >= minSelected;
      });
    }

    if (selectedAmenities.length > 0) {
      results = results.filter(h => {
        const list = (h.amenities ?? []) as string[];
        return selectedAmenities.every(a => list.includes(a));
      });
    }

    return results.length;
  }, [
    allHotels,
    minPrice,
    maxPrice,
    selectedRatings.join(','),
    selectedAmenities.join(',')
  ]);

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <FilterSidebar
              filters={filters}
              onPriceChange={handlePriceChange}
              onToggleRating={handleToggleRating}
              onToggleAmenity={handleToggleAmenity}
              allAmenities={allAmenities}
            />

            <section className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    Kết quả khách sạn {destination && `– ${destination}`}
                  </h1>
                  {!isLoading && (
                    <p className="text-muted-foreground">
                      Hiển thị {filteredHotels.length} trong tổng số {totalResults} kết quả
                    </p>
                  )}
                  {fetchError && (
                    <p className="text-red-500 text-sm mt-1">
                      {fetchError}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sắp xếp:</span>
                  <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortBy)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {Array.from({ length: 6 }).map((_, i) => <HotelCardSkeleton key={i} />)}
                </div>
              ) : totalResults === 0 ? (
                <EmptyState
                  title="Không tìm thấy khách sạn nào phù hợp"
                  message="Vui lòng thử điều chỉnh bộ lọc hoặc xóa tất cả bộ lọc để xem tất cả."
                  showClearFilters={true}
                  onClearFilters={handleClearFilters}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {filteredHotels.map(hotel => (
                      <HotelCard key={hotel.id ?? hotel.hotel_id ?? Math.random()} hotel={hotel} />
                    ))}
                  </div>

                  {Math.max(1, Math.ceil(totalResults / PAGE_SIZE)) > 1 && (
                    <div className="flex justify-center">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>Trước</Button>

                        {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(totalResults / PAGE_SIZE))) }, (_, i) => {
                          const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
                          let p;
                          if (totalPages <= 5) p = i + 1;
                          else if (page <= 3) p = i + 1;
                          else if (page >= totalPages - 2) p = totalPages - 4 + i + 1;
                          else p = page - 2 + i;
                          return (
                            <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" onClick={() => handlePageChange(p)}>
                              {p}
                            </Button>
                          );
                        })}

                        <Button variant="outline" size="sm" disabled={page >= Math.ceil(totalResults / PAGE_SIZE)} onClick={() => handlePageChange(page + 1)}>Sau</Button>
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

export default HotelSearchResultsPage;
