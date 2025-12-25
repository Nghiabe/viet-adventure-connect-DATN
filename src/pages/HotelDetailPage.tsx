// src/pages/HotelDetailPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/home/Header';
import { Footer } from '@/components/home/Footer';
import { Star, MapPin, Wifi, Coffee, Car, Heart, Calendar as CalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useBooking, PreBookingDetails } from '@/context/BookingContext';

type HotelDetail = any;

const safeParseJson = (maybeJson: any) => {
  if (typeof maybeJson !== 'string') return maybeJson;
  try { return JSON.parse(maybeJson); } catch { return maybeJson; }
};

const formatPrice = (v: number | null | undefined) => {
  if (v == null) return 'Liên hệ';
  try { return `${Number(v).toLocaleString('vi-VN')} ₫`; } catch { return String(v); }
};

const IconForAmenity = ({ name }: { name: string }) => {
  const key = String(name || '').toLowerCase();
  if (key.includes('wifi')) return <Wifi className="w-4 h-4" />;
  if (key.includes('spa')) return <Heart className="w-4 h-4" />;
  if (key.includes('đậu') || key.includes('parking') || key.includes('car')) return <Car className="w-4 h-4" />;
  if (key.includes('cà phê') || key.includes('bar') || key.includes('restaurant')) return <Coffee className="w-4 h-4" />;
  return <Star className="w-4 h-4" />;
};

// helper: format date to yyyy-MM-dd for input[type=date] min/value
function toYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeProviderUrl(providerRaw?: string | null, hotelName?: string | null) {
  if (providerRaw && typeof providerRaw === 'string' && providerRaw.trim()) {
    let p = providerRaw.trim();
    if (!/^https?:\/\//i.test(p)) p = 'https://' + p;
    // fix missing slash after booking.com if present (booking.comfrench-... -> booking.com/french-...)
    p = p.replace(/(booking\.com)(?!\/)/i, '$1/');
    try { new URL(p); return p; } catch { /* fallback */ }
  }
  if (hotelName) {
    // build booking.com url
    const slug = (hotelName || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .trim().toLowerCase().replace(/[^a-z0-9\s]+/g, '').replace(/\s+/g, '-');
    if (slug) return `https://www.booking.com/hotel/vn/${slug}.html`;
  }
  return null;
}

const HotelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateHotel = (location.state as any)?.hotel as HotelDetail | undefined;

  // prefill dates from query string
  const q = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const preCheckIn = q.get('checkInDate') || q.get('checkin') || '';
  const preCheckOut = q.get('checkOutDate') || q.get('checkout') || '';

  const [hotel, setHotel] = useState<HotelDetail | null>(stateHotel ?? null);
  const [loading, setLoading] = useState<boolean>(!stateHotel);
  const [error, setError] = useState<string | null>(null);

  // gallery / lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // booking form state
  const todayStr = toYYYYMMDD(new Date());
  const [checkIn, setCheckIn] = useState<string>(preCheckIn || todayStr);
  // default checkout = checkIn + 1 day
  const defaultCheckout = useMemo(() => {
    try {
      const d = new Date((preCheckIn || todayStr) + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      return toYYYYMMDD(d);
    } catch { return toYYYYMMDD(new Date(Date.now() + 24 * 3600 * 1000)); }
  }, [preCheckIn, todayStr]);
  const [checkOut, setCheckOut] = useState<string>(preCheckOut || defaultCheckout);

  const [guests, setGuests] = useState<number>(2);
  const [bedType, setBedType] = useState<string>('Tiêu chuẩn');
  const [isBooking, setIsBooking] = useState(false);

  // Auto-select first room type when data loads
  useEffect(() => {
    const r = hotel?.raw ? safeParseJson(hotel.raw) : hotel?.raw;
    if (r?.roomTypes && Array.isArray(r.roomTypes) && r.roomTypes.length > 0) {
      setBedType(r.roomTypes[0].name);
    }
  }, [hotel]);

  const { user, isAuthenticated } = useAuth();
  const { initiateBooking } = useBooking();

  useEffect(() => {
    if (!id) return;
    if (stateHotel) {
      setHotel(stateHotel);
      setLoading(false);
      // background refresh if needed
      (async () => {
        try {
          const res = await fetch(`/api/hotels/${encodeURIComponent(id)}`);
          if (!res.ok) return;
          const j = await res.json();
          setHotel(j);
        } catch (e) { /* ignore */ }
      })();
      return;
    }
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/hotels/${encodeURIComponent(id)}`, { signal: controller.signal });
        const txt = await res.text();
        if (!res.ok) {
          let body: any = txt;
          try { body = JSON.parse(txt); } catch { }
          setError(`API lỗi ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
          setLoading(false);
          return;
        }
        let json: any;
        try { json = JSON.parse(txt); } catch { json = safeParseJson(txt); }
        setHotel(json);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(String(err.message || err));
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id, stateHotel]);

  const raw = hotel?.raw ? safeParseJson(hotel.raw) : hotel?.raw;
  const imageUrl = hotel?.imageUrl ?? raw?.image_url ?? '/images/hotel-fallback.jpg';
  const gallery = Array.isArray(raw?.photos) && raw.photos.length > 0 ? raw.photos : (imageUrl ? [imageUrl] : []);
  const locationText = hotel?.location ?? raw?.address ?? raw?.display_location ?? 'Chưa có địa chỉ';
  const rating = hotel?.rating ?? raw?.rating?.score ?? null;
  const reviewCount = hotel?.reviewCount ?? (raw?.rating?.review_count ?? 0);
  const unitPrice = hotel?.priceVndNumber ?? null; // numeric VND price per night
  const priceDisplay = hotel?.priceVndDisplay ?? hotel?.finalPriceDisplay ?? hotel?.priceDisplay ?? 'Liên hệ';

  // amenities
  const amenities: string[] = useMemo(() => {
    const a: string[] = [];
    if (Array.isArray(hotel?.amenities) && hotel.amenities.length) a.push(...hotel.amenities);
    if (Array.isArray(raw?.amenities) && raw.amenities.length) a.push(...raw.amenities);
    return Array.from(new Set(a.map(x => String(x).trim()).filter(Boolean)));
  }, [hotel, raw]);

  // compute nights
  const nights = useMemo(() => {
    try {
      if (!checkIn || !checkOut) return 0;
      const d1 = parseISO(checkIn);
      const d2 = parseISO(checkOut);
      const diff = differenceInCalendarDays(d2, d1);
      return diff > 0 ? diff : 0;
    } catch { return 0; }
  }, [checkIn, checkOut]);

  const nightsValid = nights > 0;

  // Calculate effective price based on selected room type
  const effectiveUnitPrice = useMemo(() => {
    if (raw?.roomTypes && Array.isArray(raw.roomTypes)) {
      const room = raw.roomTypes.find((r: any) => r.name === bedType);
      if (room?.price) return Number(room.price);
    }
    return unitPrice;
  }, [raw, bedType, unitPrice]);

  const effectiveTotalPrice = (effectiveUnitPrice != null && nightsValid) ? effectiveUnitPrice * nights : null;

  // ensure checkout min updates when checkin changes
  useEffect(() => {
    try {
      const d = new Date(checkIn + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      const minOut = toYYYYMMDD(d);
      if (!checkOut || checkOut < minOut) {
        setCheckOut(minOut);
      }
    } catch { /* ignore */ }
  }, [checkIn]);

  // booking
  const handleBook = async () => {
    if (!hotel) return;

    // Auth Check
    if (!isAuthenticated || !user) {
      toast({ title: 'Vui lòng đăng nhập', description: 'Bạn cần đăng nhập để thực hiện đặt phòng.' });
      return;
    }

    if (!checkIn || !checkOut) {
      toast({ title: 'Vui lòng chọn ngày nhận/trả phòng' });
      return;
    }
    if (!nightsValid) {
      toast({ title: 'Ngày trả phải sau ngày nhận' });
      return;
    }

    // Prepare booking details for context
    const bookingDetails: PreBookingDetails = {
      type: 'hotel',
      hotelId: String(hotel.id ?? hotel.hotelId ?? hotel.hotel_id ?? ''),
      title: hotel.name ?? raw?.hotel_name ?? 'Khách sạn',
      image: hotel?.images?.[0] ?? raw?.photo1_url ?? raw?.main_photo_url,
      checkIn,
      checkOut,
      nights,
      bedType,
      participantsTotal: guests,
      unitPrice: effectiveUnitPrice ?? 0,
      clientComputedTotal: effectiveTotalPrice ?? 0,
      // fields for hotel
      providerUrl: raw?.url ?? raw?.provider_url ?? null,
      raw: hotel.raw ?? raw ?? null,
      // optional fields for type safety
      tourId: '',
      tourName: '',
      bookingDate: checkIn,
    };

    // Save to context and navigate
    initiateBooking(bookingDetails);
    navigate('/checkout');
  };

  const showMapUrl = (() => {
    if (raw?.lat && raw?.lng) {
      return `https://www.google.com/maps?q=${encodeURIComponent(raw.lat + ',' + raw.lng)}`;
    }
    if (locationText) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`;
    }
    return null;
  })();

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      {/* add some top padding so header không che nội dung */}
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="flex items-start gap-6 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>← Quay lại</Button>
          <h1 className="text-2xl md:text-3xl font-bold">{hotel?.name ?? 'Chi tiết khách sạn'}</h1>
        </div>

        {loading ? (
          <div className="py-20 text-center">Đang tải thông tin khách sạn...</div>
        ) : error && !hotel ? (
          <div className="text-center text-red-500">{error}</div>
        ) : hotel ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:flex-1 p-2">
                    <div className="w-full h-96 rounded overflow-hidden">
                      {gallery[0] ? <img src={gallery[0]} alt="main" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center">Không có ảnh</div>}
                    </div>
                  </div>
                  <div className="w-full md:w-80 p-2 flex flex-col gap-2">
                    {gallery.slice(1, 5).map((g: string, i: number) => (
                      <div key={g || i} className="h-20 overflow-hidden rounded">
                        <img src={g} onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true); }} className="object-cover w-full h-full cursor-pointer" alt={`photo-${i}`} />
                      </div>
                    ))}
                    {gallery.length > 5 && <div className="mt-auto text-sm text-muted-foreground">+{gallery.length - 5} ảnh khác</div>}
                  </div>
                </div>
              </div>

              {lightboxOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setLightboxOpen(false)}>
                  <div className="w-full max-w-4xl p-4" onClick={e => e.stopPropagation()}>
                    <img src={gallery[lightboxIndex]} className="w-full h-[70vh] object-contain rounded" alt="lightbox" />
                    <div className="mt-2 flex justify-between">
                      <Button onClick={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))} disabled={lightboxIndex <= 0}>Prev</Button>
                      <Button onClick={() => setLightboxIndex(Math.min(gallery.length - 1, lightboxIndex + 1))} disabled={lightboxIndex >= gallery.length - 1}>Next</Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" /> {locationText}</div>
                    <div className="mt-2 text-2xl font-semibold">{hotel.name}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="font-medium">{rating ? Number(rating).toFixed(1) : '—'}</span>
                        <span className="text-muted-foreground">({reviewCount} đánh giá)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">{priceDisplay}</div>
                    <div className="text-sm text-muted-foreground">Giá có thể thay đổi theo ngày</div>
                  </div>
                </div>

                <div className="prose max-w-none mt-4" dangerouslySetInnerHTML={{ __html: String(raw?.description || raw?.long_description || `<p>Thông tin về ${hotel?.name || 'khách sạn'}</p>`) }} />

                <div className="mt-6">
                  {amenities.length > 0 && <h3 className="text-lg font-semibold mb-2">Các tiện nghi</h3>}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {amenities.map((t) => (
                      <div key={t} className="flex items-center gap-2 p-3 border rounded">
                        <IconForAmenity name={t} />
                        <div className="text-sm">{t}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {amenities.length > 0 && (
                  <>
                    <h4 className="mt-4 font-medium">Tất cả tiện nghi</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 text-sm">
                      {amenities.map((a, idx) => (
                        <div key={`${a}-${idx}`} className="flex items-center gap-2 p-2 border rounded text-xs">
                          <IconForAmenity name={a} />
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Đánh giá & Nhận xét</h3>
                {raw?.reviews && Array.isArray(raw.reviews) && raw.reviews.length ? (
                  raw.reviews.slice(0, 4).map((r: any, i: number) => (
                    <div key={i} className="border-b py-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{r.author || 'Khách'}</div>
                        <div className="text-sm text-muted-foreground">{r.score ?? ''}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{r.text}</div>
                    </div>
                  ))
                ) : <div className="text-sm text-muted-foreground">Chưa có nhận xét chi tiết.</div>}
              </div>
            </div>


            {/* RIGHT: booking card */}
            <aside className="space-y-4 p-6 border rounded-lg shadow-sm bg-white">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">{hotel.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{locationText}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">Giá 1 đêm (ước tính)</div>
                  <div className="text-2xl font-bold text-primary">{formatPrice(effectiveUnitPrice)}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Nhận phòng</label>
                <div className="mt-1">
                  <Input type="date" value={checkIn} min={todayStr} onChange={(e) => setCheckIn(e.target.value)} />
                </div>

                <label className="text-sm font-medium mt-2">Trả phòng</label>
                <div className="mt-1">
                  {/* checkout min = checkIn + 1 */}
                  <Input
                    type="date"
                    value={checkOut}
                    min={(() => {
                      try {
                        const d = new Date(checkIn + 'T00:00:00'); d.setDate(d.getDate() + 1); return toYYYYMMDD(d);
                      } catch { const t = new Date(); t.setDate(t.getDate() + 1); return toYYYYMMDD(t); }
                    })()}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Khách</label>
                    <Input type="number" min={1} value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value || 1)))} />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Loại phòng/giường</label>
                    <select
                      value={bedType}
                      onChange={(e) => {
                        setBedType(e.target.value);
                      }}
                      className="w-full border rounded px-2 py-2"
                    >
                      {raw?.roomTypes && raw.roomTypes.length > 0 ? (
                        raw.roomTypes.map((rt: any, idx: number) => (
                          <option key={idx} value={rt.name}>{rt.name} - {formatPrice(rt.price)}</option>
                        ))
                      ) : (
                        <>
                          <option>Tiêu chuẩn</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm text-muted-foreground">Số đêm: {nightsValid ? nights : '—'}</div>
                  <div className="text-xl font-semibold">
                    {formatPrice(effectiveTotalPrice ?? effectiveUnitPrice)}
                  </div>
                  <div className="text-xs text-muted-foreground">Giá cuối cùng do đối tác xác nhận</div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Button onClick={handleBook} disabled={isBooking} size="lg">{isBooking ? 'Đang xử lý...' : 'Đặt ngay'}</Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium">Bản đồ</h4>
                {showMapUrl ? <a href={showMapUrl} target="_blank" rel="noreferrer"><div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-sm text-muted-foreground">Mở bản đồ</div></a> : <div className="text-sm text-muted-foreground">Không có thông tin vị trí</div>}
              </div>

              <div>
                <h4 className="font-medium">Tiện nghi chính</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(amenities.slice(0, 8).length === 0) ? <div className="text-sm text-muted-foreground">Không có dữ liệu tiện nghi</div> : amenities.slice(0, 8).map((a, idx) => <span key={`${a}-${idx}`} className="px-2 py-1 rounded bg-secondary text-xs">{a}</span>)}
                </div>
              </div>
            </aside>
          </div>
        ) : <div>Không có dữ liệu</div>
        }
      </main >
      <Footer />
    </div >
  );
};

export default HotelDetailPage;
