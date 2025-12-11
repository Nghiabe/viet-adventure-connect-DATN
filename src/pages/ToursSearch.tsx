/**
 * ToursSearch Page
 * Displays searchable, filterable list of tours from AI service.
 */
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/home/Header';
import { Footer } from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GradientPlaceholder } from '@/components/ui/GradientPlaceholder';
import { categoryConfig, categoriesArray, getCategoryInfo } from '@/lib/tourConfig';
import { getTourImageUrl, formatPriceVND } from '@/lib/tourUtils';
import {
  Star, MapPin, Clock, Heart, Loader2, Search, ChevronRight, Filter,
  Grid3X3, List, Navigation, Sun, Sunset, Moon, X
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Types for API response
interface Tour {
  _id: string;
  title: string;
  description?: string;
  price: number;
  duration: string;
  location: string;
  route?: string;
  highlights?: string[];
  schedule?: { morning?: string; afternoon?: string; evening?: string };
  category: string;
  average_rating?: number;
  review_count?: number;
  main_image?: string;
  image_gallery?: string[];
  images?: { url?: string; thumbnail?: string }[];
  is_sustainable?: boolean;
}

interface ToursResponse {
  success: boolean;
  tours: Tour[];
  count: number;
  total?: number;
}

// Tour Card for search results - supports grid/list views
const SearchTourCard = ({ tour, viewMode }: { tour: Tour; viewMode: 'grid' | 'list' }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageUrl = getTourImageUrl(tour);
  const category = getCategoryInfo(tour.category);
  const rating = tour.average_rating || 0;
  const hasSchedule = tour.schedule?.morning || tour.schedule?.afternoon || tour.schedule?.evening;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  // Grid View Card
  if (viewMode === 'grid') {
    return (
      <article className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col">
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={tour.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <GradientPlaceholder category={tour.category} title={tour.title} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${category.color} shadow-lg flex items-center gap-1.5`}>
              {category.icon}
              {category.label}
            </span>
            <button onClick={handleFavoriteClick} className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all" aria-label="Yêu thích">
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </button>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
            <span className="px-3 py-1.5 bg-black/70 text-white text-xs font-medium rounded-full flex items-center gap-1.5 backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5" />
              {tour.duration}
            </span>
            {tour.location && (
              <span className="px-3 py-1.5 bg-white/90 text-gray-800 text-xs font-medium rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <MapPin className="w-3.5 h-3.5" />
                {tour.location}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors min-h-[56px]">
            {tour.title}
          </h3>

          {/* Route */}
          {tour.route && (
            <div className="mb-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-start gap-2">
                <Navigation className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{tour.route}</p>
              </div>
            </div>
          )}

          {/* Schedule Preview */}
          {hasSchedule && (
            <div className="mb-3 grid grid-cols-3 gap-2">
              {tour.schedule?.morning && (
                <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-600 line-clamp-2">{tour.schedule.morning.slice(0, 30)}...</p>
                </div>
              )}
              {tour.schedule?.afternoon && (
                <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-200">
                  <Sunset className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-600 line-clamp-2">{tour.schedule.afternoon.slice(0, 30)}...</p>
                </div>
              )}
              {tour.schedule?.evening && (
                <div className="text-center p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                  <Moon className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-600 line-clamp-2">{tour.schedule.evening.slice(0, 30)}...</p>
                </div>
              )}
            </div>
          )}

          {/* Highlights */}
          {tour.highlights && tour.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tour.highlights.slice(0, 2).map((h, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal py-1">
                  • {h.length > 25 ? `${h.slice(0, 25)}...` : h}
                </Badge>
              ))}
              {tour.highlights.length > 2 && (
                <Badge variant="outline" className="text-xs">+{tour.highlights.length - 2}</Badge>
              )}
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <span className="font-semibold text-sm">{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
            <span className="text-muted-foreground text-sm">({tour.review_count || 0})</span>
          </div>

          {/* Price & CTA */}
          <div className="mt-auto pt-4 border-t flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-primary">{formatPriceVND(tour.price)}</span>
              <span className="text-sm text-muted-foreground block">/người</span>
            </div>
            <Button asChild className="rounded-full px-6 bg-gradient-to-r from-primary to-primary/80 shadow-lg">
              <Link to={`/experience/${tour._id}`}>
                Chi tiết <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </article>
    );
  }

  // List View Card (simplified)
  return (
    <article className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border border-gray-100 flex">
      <div className="relative w-80 flex-shrink-0 overflow-hidden">
        {imageUrl && !imgError ? (
          <img src={imageUrl} alt={tour.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <GradientPlaceholder category={tour.category} title={tour.title} />
        )}
        <span className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold text-white ${category.color} shadow-lg flex items-center gap-1.5`}>
          {category.icon}
          {category.label}
        </span>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{tour.title}</h3>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          {tour.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" />{tour.location}</span>}
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" />{tour.duration}</span>
        </div>

        {tour.route && (
          <div className="mb-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 inline-block">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm text-gray-700">{tour.route}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
            ))}
          </div>
          <span className="font-semibold">{rating.toFixed(1)}</span>
          <span className="text-muted-foreground">({tour.review_count || 0})</span>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div>
            <span className="text-2xl font-bold text-primary">{formatPriceVND(tour.price)}</span>
            <span className="text-sm text-muted-foreground">/người</span>
          </div>
          <Button asChild size="lg" className="rounded-full px-8 bg-gradient-to-r from-primary to-primary/80">
            <Link to={`/experience/${tour._id}`}>Xem chi tiết <ChevronRight className="w-5 h-5 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </article>
  );
};

// Main Component
const ToursSearch = () => {
  const [searchParams] = useSearchParams();
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [sustainableOnly, setSustainableOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const locationFilter = searchParams.get('location') || '';
  const urlQuery = searchParams.get('q') || '';

  // Fetch tours from AI service
  const { data, isLoading, isError, refetch } = useQuery<ToursResponse>({
    queryKey: ['tours-search', locationFilter, searchQuery, priceRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (locationFilter) params.set('location', locationFilter);
      if (searchQuery || urlQuery) params.set('query', searchQuery || urlQuery);
      if (selectedCategories.length === 1) params.set('category', selectedCategories[0]);
      if (priceRange[0] > 0) params.set('min_price', priceRange[0].toString());
      if (priceRange[1] < 5000000) params.set('max_price', priceRange[1].toString());
      params.set('limit', '20');

      const response = await fetch(`/api/ai-tours/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 30000,
  });

  const tours = data?.tours || [];

  // Client-side filtering & sorting
  const filteredTours = tours.filter(tour => {
    if (selectedRatings.length > 0 && !selectedRatings.some(r => (tour.average_rating || 0) >= r)) return false;
    if (sustainableOnly && !tour.is_sustainable) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(tour.category)) return false;
    return true;
  });

  const sortedTours = [...filteredTours].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'rating': return (b.average_rating || 0) - (a.average_rating || 0);
      default: return 0;
    }
  });

  const toggleCategory = (id: string) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const toggleRating = (r: number) => setSelectedRatings(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedRatings([]);
    setSustainableOnly(false);
    setPriceRange([0, 5000000]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedRatings.length > 0 || sustainableOnly || priceRange[0] > 0 || priceRange[1] < 5000000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <Header />

      <main className="pt-20">
        {/* Hero */}
        <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Khám Phá Tours</h1>
            <p className="text-lg text-muted-foreground mb-6">{sortedTours.length} tours độc đáo đang chờ bạn</p>

            <form onSubmit={(e) => { e.preventDefault(); refetch(); }} className="flex gap-3 max-w-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Tìm theo tên, điểm đến..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-14 text-lg rounded-2xl border-2" />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 rounded-2xl"><Search className="w-5 h-5 mr-2" />Tìm kiếm</Button>
            </form>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <aside className="w-80 sticky top-24 h-fit hidden lg:block">
              <div className="bg-white rounded-2xl border-2 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Filter className="w-5 h-5 text-primary" />Bộ lọc</h2>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-sm text-primary flex items-center gap-1"><X className="w-4 h-4" />Xóa</button>
                  )}
                </div>

                {/* Price */}
                <div className="mb-8">
                  <h3 className="font-semibold mb-4">💰 Khoảng giá</h3>
                  <Slider value={priceRange} onValueChange={setPriceRange} max={5000000} step={100000} className="mb-3" />
                  <div className="flex justify-between text-sm font-medium text-primary">
                    <span>{priceRange[0].toLocaleString()}₫</span>
                    <span>{priceRange[1].toLocaleString()}₫</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-8">
                  <h3 className="font-semibold mb-4">📂 Danh mục</h3>
                  <div className="space-y-2">
                    {categoriesArray.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedCategories.includes(cat.id) ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 hover:bg-gray-100'}`}
                      >
                        {cat.icon}
                        <span className="font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-8">
                  <h3 className="font-semibold mb-4">⭐ Đánh giá</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2].map(stars => (
                      <button
                        key={stars}
                        onClick={() => toggleRating(stars)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedRatings.includes(stars) ? 'bg-primary/10 border-2 border-primary' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`}
                      >
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-sm font-medium">& hơn</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sustainable */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium flex items-center gap-2">🌿 Du lịch Bền vững</span>
                    <Switch checked={sustainableOnly} onCheckedChange={setSustainableOnly} />
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 bg-white rounded-2xl border-2 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Sắp xếp:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Phù hợp nhất</SelectItem>
                      <SelectItem value="price_asc">Giá thấp → cao</SelectItem>
                      <SelectItem value="price_desc">Giá cao → thấp</SelectItem>
                      <SelectItem value="rating">Đánh giá cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                  <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="rounded-lg"><Grid3X3 className="w-4 h-4" /></Button>
                  <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="rounded-lg"><List className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* States */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <span className="text-lg">Đang tải tours...</span>
                </div>
              )}

              {isError && (
                <div className="text-center py-20 bg-white rounded-2xl border">
                  <div className="text-5xl mb-4">😢</div>
                  <p className="mb-4">Không thể tải dữ liệu</p>
                  <Button onClick={() => refetch()}>Thử lại</Button>
                </div>
              )}

              {!isLoading && !isError && sortedTours.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold mb-2">Chưa có tours nào</h3>
                  <p className="text-muted-foreground mb-6">Sử dụng AI Planner để tìm tours mới!</p>
                  <Button asChild size="lg"><Link to="/">Về trang chủ</Link></Button>
                </div>
              )}

              {/* Tour Cards */}
              {!isLoading && !isError && sortedTours.length > 0 && (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-6'}>
                  {sortedTours.map(tour => (
                    <SearchTourCard key={tour._id} tour={tour} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ToursSearch;
