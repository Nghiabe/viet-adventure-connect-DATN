// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// // If your Node version is >=18 you can remove the node-fetch import and use global fetch.
// // import fetch from 'node-fetch';
// import path from 'path';
// import fs from 'fs';
// import fsp from 'fs/promises';
// import crypto from 'crypto';
// // ensure protocol
// function ensureProtocolServer(url) {
//   if (!url) return url;
//   if (/^https?:\/\//i.test(url)) return url;
//   return 'https://' + url;
// }

// // tạo slug giống frontend
// function createBookingSlugServer(hotelName) {
//   if (!hotelName) return '';
//   return String(hotelName || '')
//     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
//     .replace(/đ/g, 'd').replace(/Đ/g, 'D')
//     .trim().toLowerCase()
//     .replace(/[^a-z0-9\s]+/g, '').replace(/\s+/g, '-');
// }

// /**
//  * Normalize provider url server-side and FORCE canonical booking URL when
//  * - providerRaw contains "booking.com" AND
//  * - providerRaw path does NOT include "/hotel/"
//  */
// function normalizeProviderUrlServer(providerRaw, hotelName) {
//   const fallback = hotelName ? `https://www.booking.com/hotel/vn/${createBookingSlugServer(hotelName)}.html` : null;
//   if (!providerRaw) return fallback;

//   let p = String(providerRaw).trim();
//   if (!p) return fallback;

//   // ensure protocol
//   p = ensureProtocolServer(p);

//   // If domain contains booking.com
//   try {
//     const u = new URL(p);
//     const hostname = (u.hostname || '').toLowerCase();
//     if (hostname.includes('booking.com')) {
//       // If path includes '/hotel/' -> accept (but still normalize to https)
//       if (u.pathname && u.pathname.toLowerCase().includes('/hotel/')) {
//         return p; // already canonical-ish
//       }
//       // else: path not in /hotel/ -> FORCE canonical built from hotelName
//       if (hotelName) return `https://www.booking.com/hotel/vn/${createBookingSlugServer(hotelName)}.html`;
//       // no hotelName -> fallback to domain root with appended canonical path (safe)
//       return `https://www.booking.com/hotel/vn/${createBookingSlugServer(hotelName)}.html`;
//     }
//   } catch (e) {
//     // If URL ctor failed, fallthrough to fallback
//     return fallback;
//   }

//   // not booking.com -> return normalized p
//   return p;
// }


// dotenv.config();

// // ---------------- Exchange rate cache & helper ----------------
// let EXCHANGE_CACHE = { ts: 0, usd_to_vnd: null };
// const EXCHANGE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

// async function getUsdToVndRate() {
//   const now = Date.now();
//   if (EXCHANGE_CACHE.usd_to_vnd && (now - EXCHANGE_CACHE.ts) < EXCHANGE_TTL_MS) {
//     return EXCHANGE_CACHE.usd_to_vnd;
//   }

//   // env override
//   if (process.env.USD_TO_VND) {
//     const v = Number(process.env.USD_TO_VND);
//     if (!Number.isNaN(v) && v > 0) {
//       EXCHANGE_CACHE = { ts: now, usd_to_vnd: v };
//       return v;
//     }
//   }

//   // fetch from exchangerate.host
//   try {
//     const resp = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=VND');
//     if (!resp.ok) throw new Error('Rate fetch failed: ' + resp.status);
//     const j = await resp.json();
//     const rate = j?.rates?.VND;
//     if (rate && typeof rate === 'number') {
//       EXCHANGE_CACHE = { ts: now, usd_to_vnd: rate };
//       return rate;
//     }
//   } catch (e) {
//     console.warn('Failed to fetch USD->VND rate:', e?.message || e);
//   }

//   // fallback
//   const fallback = Number(process.env.USD_TO_VND_FALLBACK || process.env.USD_TO_VND || 24000);
//   EXCHANGE_CACHE = { ts: now, usd_to_vnd: fallback };
//   return fallback;
// }

// // ---------------- App & config ----------------
// const app = express();
// const PORT = process.env.PORT || 4000;

// app.use(cors());
// app.use(express.json());

// const STAYAPI_KEY = (process.env.STAYAPI_KEY || '').trim();
// const STAYAPI_BASE = process.env.STAYAPI_BASE || 'https://api.stayapi.com/v1';

// function previewKey(key) {
//   if (!key) return '(empty)';
//   return key.length > 12 ? `${key.slice(0, 8)}...${key.slice(-4)}` : key;
// }

// // ---------------- Simple in-memory cache ----------------
// const cache = new Map();
// function setCache(key, value, ttlSec = 30) {
//   cache.set(key, { ts: Date.now(), ttl: ttlSec * 1000, value });
// }
// function getCache(key) {
//   const entry = cache.get(key);
//   if (!entry) return null;
//   if (Date.now() - entry.ts > entry.ttl) {
//     cache.delete(key);
//     return null;
//   }
//   return entry.value;
// }
// setInterval(() => {
//   for (const [k, v] of cache.entries()) {
//     if (Date.now() - v.ts > v.ttl) cache.delete(k);
//   }
// }, 60_000);

// // ---------------- Helper to call StayAPI ----------------
// async function stayGet(pathSuffix, params = {}) {
//   if (!STAYAPI_KEY) throw new Error('STAYAPI_KEY chưa được cấu hình trong .env');

//   const url = new URL(STAYAPI_BASE + pathSuffix);
//   Object.entries(params).forEach(([k, v]) => {
//     if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
//   });

//   const res = await fetch(url.toString(), {
//     method: 'GET',
//     headers: {
//       'x-api-key': STAYAPI_KEY,
//       'Content-Type': 'application/json',
//     },
//   });

//   const text = await res.text().catch(() => '');
//   let json;
//   try { json = text ? JSON.parse(text) : {}; } catch (err) { json = { _raw_text: text }; }

//   if (!res.ok) {
//     console.error('StayAPI error', res.status, {
//       url: url.toString(),
//       previewKey: previewKey(STAYAPI_KEY),
//       bodyPreview: (typeof json === 'object' ? JSON.stringify(json).slice(0, 800) : text.slice(0, 800)),
//     });
//     const errMsg = json?.error?.message || json?.message || text || `HTTP ${res.status}`;
//     const error = new Error(errMsg);
//     error.status = res.status;
//     error.body = json;
//     throw error;
//   }

//   return json;
// }

// // ---------------- Helpers: extract arrays, normalize ----------------
// function extractArrayFromResponse(json) {
//   if (!json) return [];
//   if (Array.isArray(json.data)) return json.data;
//   if (json.data && Array.isArray(json.data.hotels)) return json.data.hotels;
//   if (Array.isArray(json)) return json;
//   const common = ['results', 'items', 'hotels', 'hotel_list', 'data_list'];
//   for (const k of common) {
//     if (Array.isArray(json[k])) return json[k];
//     if (json.data && Array.isArray(json.data[k])) return json.data[k];
//   }
//   // fallback: values that are arrays
//   for (const val of Object.values(json)) {
//     if (Array.isArray(val)) return val;
//   }
//   return [];
// }

// // Basic normalize (synchronous) - will add VND conversion later in route when rate available
// function baseNormalizeHotel(item, normalizedQuery = '') {
//   const id = String(item.hotel_id || item.id || item.place_id || Math.random());
//   const name = item.hotel_name || item.name || item.title || 'Unknown hotel';

//   // try to pull some possible price fields (will interpret later)
//   const rawPrice = item.price ?? item.raw?.price ?? item.price_info ?? null;
//   const minTotal = item.min_total_price ?? null;

//   const imageUrl = item.image_url || item.thumbnail || (item.photos && item.photos[0]) || 'https://picsum.photos/seed/hotel-fallback/800/600';
//   const address = item.address || item.display_location || item.location || normalizedQuery || null;

//   const rating = (item.rating?.score ?? item.review_score ?? null);
//   const reviewCount = (item.rating?.review_count ?? item.review_count ?? 0);

//   const amenities = Array.isArray(item.amenities) ? item.amenities : [];

//   return {
//     id,
//     name,
//     rawPrice,   // keep rawPrice object (maybe contains amount/currency/display)
//     minTotal,
//     location: address,
//     imageUrl,
//     rating,
//     reviewCount,
//     amenities,
//     raw: item
//   };
// }

// // ---------------- Routes ----------------

// // Health
// app.get('/', (req, res) => {
//   res.json({ ok: true, message: 'API server is running', previewKey: previewKey(STAYAPI_KEY) });
// });

// // GET /api/hotels?city=...&page=...&per_page=...
// app.get('/api/hotels', async (req, res) => {
//   try {
//     const city = req.query.city || 'Da Nang';
//     const checkin = req.query.checkin || '2025-12-01';
//     const checkout = req.query.checkout || '2025-12-03';
//     const adults = req.query.adults || '2';
//     const rooms = req.query.rooms || '1';

//     const page = Math.max(1, Number(req.query.page) || 1);
//     const perPage = Math.min(100, Math.max(1, Number(req.query.per_page) || 20));
//     const cacheKey = `hotels:${city}:${checkin}:${checkout}:${adults}:${rooms}:${page}:${perPage}`;

//     const cached = getCache(cacheKey);
//     if (cached) {
//       return res.json({ ...cached, cached: true });
//     }

//     // 1) lookup dest_id
//     let destResp;
//     try {
//       destResp = await stayGet('/booking/destinations/lookup', { query: city, language: 'en-us' });
//     } catch (err) {
//       console.error('Dest lookup failed:', err?.message || err);
//       // if 429 and cache exists for base city (fallback), use it
//       return res.status(err.status || 500).json({ hotels: [], count: 0, error: err.message || 'Dest lookup failed' });
//     }

//     const destId = destResp.dest_id || destResp.data?.dest_id || destResp.id;
//     const destType = destResp.dest_type || destResp.data?.dest_type || 'CITY';
//     const normalizedQuery = destResp.normalized_query || destResp.data?.normalized_query || city;

//     if (!destId) {
//       return res.status(200).json({ hotels: [], count: 0, message: 'Không tìm thấy điểm đến phù hợp' });
//     }

//     // 2) search hotels
//     let searchResp;
//     try {
//       searchResp = await stayGet('/booking/search', {
//         dest_id: destId,
//         dest_type: destType,
//         checkin,
//         checkout,
//         adults,
//         rooms,
//         currency: 'USD', // request USD to be consistent for conversion -> you can also request VND but USD is easier to convert
//         language: 'en-us',
//         rows_per_page: perPage,
//         page
//       });
//     } catch (err) {
//       console.error('StayAPI /booking/search failed:', err?.status || '', err?.message || err);
//       // If rate-limited (429) and we have a cache for this city, return cached
//       if (err.status === 429) {
//         const fallback = getCache(cacheKey);
//         if (fallback) return res.json({ ...fallback, cached: true });
//         // try on-disk cache (optional)
//         const diskPath = path.join(process.cwd(), 'stay_cache', encodeURIComponent(cacheKey) + '.json');
//         if (fs.existsSync(diskPath)) {
//           try {
//             const raw = fs.readFileSync(diskPath, 'utf8');
//             const parsed = JSON.parse(raw);
//             return res.json({ ...parsed, cached: true });
//           } catch (e) { /* ignore */ }
//         }
//       }
//       return res.status(err.status || 500).json({ hotels: [], count: 0, error: err.body ?? err.message ?? 'StayAPI error' });
//     }

//     // parse raw hotels
//     let rawHotels = extractArrayFromResponse(searchResp);
//     if ((!rawHotels || rawHotels.length === 0) && searchResp.data && Array.isArray(searchResp.data.results)) {
//       rawHotels = searchResp.data.results;
//     }

//     if (!rawHotels || rawHotels.length === 0) {
//       // as last fallback, try other shapes
//       if (searchResp.hotels && Array.isArray(searchResp.hotels)) rawHotels = searchResp.hotels;
//     }

//     // compute exchange rate
//     const usdToVnd = await getUsdToVndRate().catch(e => {
//       console.warn('getUsdToVndRate failed:', e?.message || e);
//       return Number(process.env.USD_TO_VND || 24000);
//     });

//     // map & normalize with VND conversion
//     const hotels = rawHotels.map(item => {
//       const base = baseNormalizeHotel(item, normalizedQuery);

//       // derive numeric price from rawPrice or minTotal
//       let priceNumber = null;
//       let currency = null;
//       const rp = base.rawPrice;
//       if (rp) {
//         // rp.amount may be "$31.02" or "31.02"
//         if (rp.amount != null && rp.amount !== '') {
//           const numeric = Number(String(rp.amount).replace(/[^0-9.-]+/g, ''));
//           if (Number.isFinite(numeric)) {
//             priceNumber = numeric;
//           }
//         }
//         if (!priceNumber && rp.value != null) {
//           const numeric = Number(String(rp.value).replace(/[^0-9.-]+/g, ''));
//           if (Number.isFinite(numeric)) priceNumber = numeric;
//         }
//         currency = rp.currency || rp.curr || rp.code || null;
//       }
//       // fallback to minTotal if present
//       if (priceNumber === null && base.minTotal != null) {
//         const n = Number(base.minTotal);
//         if (Number.isFinite(n)) priceNumber = n;
//       }

//       // fallback to item.raw.priceNumber or item.priceNumber
//       if (priceNumber === null) {
//         const maybe = item.priceNumber ?? item.min_total_price ?? item.price;
//         if (maybe != null) {
//           const n = Number(String(maybe).replace(/[^0-9.-]+/g, ''));
//           if (Number.isFinite(n)) priceNumber = n;
//         }
//       }

//       // priceDisplay from API if exists
//       const priceDisplayFromApi = (rp && rp.display) || item.priceDisplay || (rp && rp.amount ? String(rp.amount) : null);

//       // compute price in VND if possible
//       let priceVndNumber = null;
//       let priceVndDisplay = null;

//       if (currency && typeof currency === 'string') currency = currency.toUpperCase();

//       if (currency === 'USD' && priceNumber != null) {
//         priceVndNumber = Math.round(priceNumber * usdToVnd);
//         priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
//       } else if ((currency === 'VND' || currency === 'VNĐ' || currency === '₫') && priceNumber != null) {
//         priceVndNumber = Math.round(priceNumber);
//         priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
//       } else if (!currency && priceNumber != null) {
//         // if no currency info, we won't assume; but if STAYAPI was requested with currency=USD earlier, it's likely USD
//         // Since we requested currency=USD, assume priceNumber is USD (best-effort).
//         // To be safer: check searchResp.requested_currency if exists.
//         priceVndNumber = Math.round(priceNumber * usdToVnd);
//         priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
//       }

//       // prepare final display (frontend will prefer priceVndDisplay)
//       const finalPriceDisplay = priceVndDisplay ?? priceDisplayFromApi ?? (priceNumber != null ? String(priceNumber) : 'Liên hệ');

//       return {
//         id: base.id,
//         name: base.name,
//         location: base.location,
//         imageUrl: base.imageUrl,
//         rating: base.rating,
//         reviewCount: base.reviewCount,
//         amenities: base.amenities,
//         // price fields for frontend
//         priceNumber,          // original numeric (likely USD)
//         priceDisplay: priceDisplayFromApi ?? null, // original display from API
//         priceVndNumber,       // converted VND number or null
//         priceVndDisplay,      // converted VND string or null
//         finalPriceDisplay,    // string: prefer VND, fallback to API display or number
//         raw: base.raw
//       };
//     });

//     const payload = { hotels, count: hotels.length, page, per_page: perPage, exchange_rate_usd_to_vnd: usdToVnd };
//     // cache to memory and optionally to disk
//     setCache(cacheKey, payload, 20); // 20 seconds cache
//     try {
//       const cacheDir = path.join(process.cwd(), 'stay_cache');
//       if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
//       fs.writeFileSync(path.join(cacheDir, encodeURIComponent(cacheKey) + '.json'), JSON.stringify(payload), 'utf8');
//     } catch (e) { /* ignore disk errors */ }

//     res.json(payload);

//   } catch (err) {
//     console.error('Error in /api/hotels:', err?.message || err);
//     // If underlying stayGet threw with status 429, try to return a cached result if available
//     const status = err?.status || 500;
//     return res.status(status).json({ hotels: [], count: 0, error: err?.message || 'Internal server error' });
//   }
// });

// // ---------------- GET /api/hotels/:id ----------------
// app.get('/api/hotels/:id', async (req, res) => {
//   try {
//     const hotelId = req.params.id;
//     if (!hotelId) return res.status(400).json({ error: 'Missing hotel id' });

//     console.log('[DETAIL] request for hotel id=', hotelId);

//     // helper to build final normalized hotel object (reuse baseNormalizeHotel + price conversion)
//     const buildFinal = async (item, normalizedQuery = '') => {
//       const base = baseNormalizeHotel(item, normalizedQuery);
//       // get rate
//       const usdToVnd = await getUsdToVndRate().catch(() => Number(process.env.USD_TO_VND || 24000));
//       // derive numeric price
//       let priceNumber = null;
//       let currency = null;
//       const rp = base.rawPrice;
//       if (rp) {
//         if (rp.amount != null && rp.amount !== '') {
//           const numeric = Number(String(rp.amount).replace(/[^0-9.-]+/g, ''));
//           if (Number.isFinite(numeric)) priceNumber = numeric;
//         }
//         if (!priceNumber && rp.value != null) {
//           const numeric = Number(String(rp.value).replace(/[^0-9.-]+/g, ''));
//           if (Number.isFinite(numeric)) priceNumber = numeric;
//         }
//         currency = rp.currency || rp.curr || rp.code || null;
//       }
//       if (priceNumber === null && base.minTotal != null) {
//         const n = Number(base.minTotal);
//         if (Number.isFinite(n)) priceNumber = n;
//       }
//       if (priceNumber === null) {
//         const maybe = base.raw?.priceNumber ?? base.raw?.min_total_price ?? base.raw?.price;
//         if (maybe != null) {
//           const n = Number(String(maybe).replace(/[^0-9.-]+/g, ''));
//           if (Number.isFinite(n)) priceNumber = n;
//         }
//       }

//       if (currency && typeof currency === 'string') currency = currency.toUpperCase();

//       let priceVndNumber = null;
//       let priceVndDisplay = null;
//       const priceDisplayFromApi = (rp && rp.display) || base.raw?.priceDisplay || (rp && rp.amount ? String(rp.amount) : null);

//       if (currency === 'USD' && priceNumber != null) {
//         priceVndNumber = Math.round(priceNumber * usdToVnd);
//         priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
//       } else if ((currency === 'VND' || currency === 'VNĐ' || currency === '₫') && priceNumber != null) {
//         priceVndNumber = Math.round(priceNumber);
//         priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
//       } else if (!currency && priceNumber != null) {
//         // best-effort assume USD (because list requested USD earlier) — otherwise fallback
//         priceVndNumber = Math.round(priceNumber * usdToVnd);
//         priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
//       }

//       const finalPriceDisplay = priceVndDisplay ?? priceDisplayFromApi ?? (priceNumber != null ? String(priceNumber) : 'Liên hệ');

//       return {
//         id: base.id,
//         name: base.name,
//         location: base.location,
//         imageUrl: base.imageUrl,
//         rating: base.rating,
//         reviewCount: base.reviewCount,
//         amenities: base.amenities,
//         priceNumber,
//         priceDisplay: priceDisplayFromApi ?? null,
//         priceVndNumber,
//         priceVndDisplay,
//         finalPriceDisplay,
//         raw: base.raw
//       };
//     };

//     // 1) try booking/hotel_info
//     try {
//       const infoResp = await stayGet('/booking/hotel_info', {
//         hotel_id: hotelId,
//         language: 'en-us',
//         currency: 'VND'
//       });
//       console.log('[DETAIL] booking/hotel_info preview:', JSON.stringify(infoResp).slice(0,400));
//       const item = infoResp.data || infoResp.hotel || infoResp;
//       if (item && typeof item === 'object') {
//         const hotel = await buildFinal(item, item.display_location || '');
//         return res.json(hotel);
//       }
//     } catch (e) {
//       console.warn('[DETAIL] booking/hotel_info failed:', e?.message || e);
//     }

//     // 2) fallback to /hotel/search-by-id
//     try {
//       const fb = await stayGet('/hotel/search-by-id', { id: hotelId, currency: 'VND' });
//       console.log('[DETAIL] /hotel/search-by-id preview:', JSON.stringify(fb).slice(0,400));
//       const item = fb.data || fb.hotel || fb;
//       if (item && typeof item === 'object') {
//         const hotel = await buildFinal(item, item.display_location || '');
//         return res.json(hotel);
//       }
//     } catch (e) {
//       console.warn('[DETAIL] /hotel/search-by-id failed:', e?.message || e);
//     }

//     // --- Try find by city (client must send ?city=Da Nang) ---
//     const tryFindByCity = async () => {
//       const city = req.query.city || req.query.destination || null;
//       if (!city) return null;
//       try {
//         const dest = await stayGet('/booking/destinations/lookup', {
//           query: city,
//           language: 'en-us'
//         });

//         const destId = dest.dest_id || dest.data?.dest_id;
//         if (!destId) return null;

//         const search = await stayGet('/booking/search', {
//           dest_id: destId,
//           dest_type: dest.dest_type || 'CITY',
//           rows_per_page: 100,
//           page: 1,
//           checkin: '2025-12-01',
//           checkout: '2025-12-02',
//           currency: 'VND',
//           language: 'en-us'
//         });

//         const arr = extractArrayFromResponse(search);
//         const found = (arr || []).find(
//           x => String(x.hotel_id || x.id) === String(hotelId)
//         );

//         return found || null;
//       } catch (e) {
//         console.warn('[DETAIL] tryFindByCity failed', e?.message || e);
//         return null;
//       }
//     };

//     const foundByCity = await tryFindByCity();
//     if (foundByCity) {
//       // use buildFinal which normalizes + converts price (previous code called undefined normalizeHotel)
//       try {
//         const hotelObj = await buildFinal(foundByCity, foundByCity.display_location || '');
//         return res.json(hotelObj);
//       } catch (e) {
//         console.warn('[DETAIL] buildFinal on foundByCity failed', e?.message || e);
//       }
//     }

//     // 3) last resort: search listing and find id inside
//     try {
//       const searchResp = await stayGet('/booking/search', { rows_per_page: 50, page: 1, currency: 'VND' });
//       const arr = extractArrayFromResponse(searchResp);
//       const found = (arr || []).find(x => String(x.hotel_id || x.id) === String(hotelId));
//       if (found) {
//         console.log('[DETAIL] found in /booking/search results');
//         const hotel = await buildFinal(found, found.display_location || '');
//         return res.json(hotel);
//       }
//     } catch (e) {
//       console.warn('[DETAIL] fallback search failed:', e?.message || e);
//     }

//     // nothing worked
//     return res.status(404).json({ error: "Hotel detail fetch failed", detail: "Not Found in all endpoints" });
//   } catch (err) {
//     console.error('[DETAIL] Unexpected error:', err);
//     return res.status(500).json({ error: err?.message || 'internal error' });
//   }
// });

// // ---------------- POST /api/bookings ----------------
// app.post('/api/bookings', async (req, res) => {
//   try {
//     const body = req.body || {};

//     // Normalise keys (accept checkin/checkInDate, checkout/checkOutDate, guests as number or string)
//     const hotelId = body.hotelId || body.hotel_id || body.hotel || null;
//     const checkin = body.checkin || body.checkInDate || body.check_in_date || null;
//     const checkout = body.checkout || body.checkOutDate || body.check_out_date || null;
//     const guestsRaw = body.guests ?? body.adults ?? body.numGuests ?? null;
//     const guests = guestsRaw != null ? Number(guestsRaw) : null;

//     if (!hotelId) return res.status(400).json({ error: 'Missing hotelId' });
//     if (!checkin) return res.status(400).json({ error: 'Missing checkin' });
//     if (!checkout) return res.status(400).json({ error: 'Missing checkout' });
//     if (!guests) return res.status(400).json({ error: 'Missing guests' });

//     // Validate dates
//     const checkinDate = new Date(checkin);
//     const checkoutDate = new Date(checkout);
//     if (Number.isNaN(checkinDate.getTime()) || Number.isNaN(checkoutDate.getTime())) {
//       return res.status(400).json({ error: 'Invalid date format. Use yyyy-mm-dd or ISO date.' });
//     }
//     if (checkoutDate <= checkinDate) {
//       return res.status(400).json({ error: 'Checkout must be after checkin' });
//     }

//     // Coerce more fields
//     const bedType = body.bedType || body.bed_type || null;
//     const unitPrice = body.unitPrice ?? body.unit_price ?? null;
//     const totalPrice = body.totalPrice ?? body.total_price ?? null;
//     const nights = body.nights ?? Math.max(1, Math.ceil((checkoutDate - checkinDate) / (24*60*60*1000)));

//     // Create ID
//     const id = crypto.randomUUID ? crypto.randomUUID() : crypto.createHash('sha1').update(Date.now() + Math.random().toString()).digest('hex');

//     const booking = {
//       id,
//       hotelId,
//       hotelName: body.hotelName || body.hotel_name || null,
//       providerUrl: body.providerUrl || body.provider_url || null,
//       checkin: checkinDate.toISOString().slice(0,10),
//       checkout: checkoutDate.toISOString().slice(0,10),
//       guests,
//       bedType,
//       nights,
//       unitPrice,
//       totalPrice,
//       raw: body.raw || null,
//       status: 'provisional',
//       createdAt: new Date().toISOString()
//     };

//     // Save
//     const bookingsPath = path.join(process.cwd(), 'stay_bookings.json');
//     let arr = [];
//     try {
//       if (fs.existsSync(bookingsPath)) {
//         const txt = fs.readFileSync(bookingsPath, 'utf8');
//         arr = JSON.parse(txt || '[]');
//       }
//     } catch (e) {
//       console.warn('Could not read bookings file', e?.message || e);
//       arr = [];
//     }
//     arr.unshift(booking);
//     try {
//       fs.writeFileSync(bookingsPath, JSON.stringify(arr.slice(0, 1000), null, 2), 'utf8');
//     } catch (e) {
//       console.warn('Could not write bookings file', e?.message || e);
//       // still return success but warn
//     }

//     const normalizedProvider = normalizeProviderUrlServer(booking.providerUrl, booking.hotelName);
//     return res.json({ id: booking.id, provider_url: normalizedProvider, booking });


//   } catch (err) {
//     console.error('Error in /api/bookings:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


// // ---------------- Start ----------------
// app.listen(PORT, () => {
//   console.log(`✅ API server listening on http://localhost:${PORT}`);
//   console.log('StayAPI preview key:', previewKey(STAYAPI_KEY));
// });
// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// If your Node < 18 and don't have global fetch, uncomment the next line:
// import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config();

// If runtime has no global fetch (Node < 18), try to polyfill using node-fetch
if (typeof globalThis.fetch !== 'function') {
  try {
    // dynamic require for compatibility
    // eslint-disable-next-line no-unused-vars
    const nodeFetch = await import('node-fetch');
    globalThis.fetch = nodeFetch.default;
    console.log('Polyfilled fetch with node-fetch');
  } catch (e) {
    console.warn('No global fetch and node-fetch not available. Remote calls will fail if fetch is missing.');
  }
}

// ---------- Utilities ----------
function previewKey(key) {
  if (!key) return '(empty)';
  return key.length > 12 ? `${key.slice(0, 8)}...${key.slice(-4)}` : key;
}

function ensureProtocolServer(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return 'https://' + url;
}

function createBookingSlugServer(hotelName) {
  if (!hotelName) return '';
  return String(hotelName || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .trim().toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '').replace(/\s+/g, '-');
}

function normalizeProviderUrlServer(providerRaw, hotelName) {
  const fallback = hotelName ? `https://www.booking.com/hotel/vn/${createBookingSlugServer(hotelName)}.html` : null;
  if (!providerRaw) return fallback;

  let p = String(providerRaw).trim();
  if (!p) return fallback;

  p = ensureProtocolServer(p);

  try {
    const u = new URL(p);
    const hostname = (u.hostname || '').toLowerCase();
    if (hostname.includes('booking.com')) {
      if (u.pathname && u.pathname.toLowerCase().includes('/hotel/')) {
        return p;
      }
      if (hotelName) return `https://www.booking.com/hotel/vn/${createBookingSlugServer(hotelName)}.html`;
      return fallback;
    }
  } catch (e) {
    return fallback;
  }

  return p;
}

// Simple in-memory cache
const cache = new Map();
function setCache(key, value, ttlSec = 30) {
  cache.set(key, { ts: Date.now(), ttl: ttlSec * 1000, value });
}
function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}
setInterval(() => {
  for (const [k, v] of cache.entries()) {
    if (Date.now() - v.ts > v.ttl) cache.delete(k);
  }
}, 60_000);

// ---------- Exchange rate cache ----------
let EXCHANGE_CACHE = { ts: 0, usd_to_vnd: null };
const EXCHANGE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

async function getUsdToVndRate() {
  const now = Date.now();
  if (EXCHANGE_CACHE.usd_to_vnd && (now - EXCHANGE_CACHE.ts) < EXCHANGE_TTL_MS) {
    return EXCHANGE_CACHE.usd_to_vnd;
  }

  if (process.env.USD_TO_VND) {
    const v = Number(process.env.USD_TO_VND);
    if (!Number.isNaN(v) && v > 0) {
      EXCHANGE_CACHE = { ts: now, usd_to_vnd: v };
      return v;
    }
  }

  try {
    const resp = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=VND');
    if (!resp.ok) throw new Error('Rate fetch failed: ' + resp.status);
    const j = await resp.json();
    const rate = j?.rates?.VND;
    if (rate && typeof rate === 'number') {
      EXCHANGE_CACHE = { ts: now, usd_to_vnd: rate };
      return rate;
    }
  } catch (e) {
    console.warn('Failed to fetch USD->VND rate:', e?.message || e);
  }

  const fallback = Number(process.env.USD_TO_VND_FALLBACK || process.env.USD_TO_VND || 24000);
  EXCHANGE_CACHE = { ts: now, usd_to_vnd: fallback };
  return fallback;
}

// ---------- STAYAPI helper ----------
const STAYAPI_KEY = (process.env.STAYAPI_KEY || '').trim();
const STAYAPI_BASE = process.env.STAYAPI_BASE || 'https://api.stayapi.com/v1';

async function stayGet(pathSuffix, params = {}) {
  if (!STAYAPI_KEY) throw Object.assign(new Error('STAYAPI_KEY chưa được cấu hình trong .env'), { status: 400 });

  const url = new URL(STAYAPI_BASE + pathSuffix);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': STAYAPI_KEY,
      'Content-Type': 'application/json',
    },
  });

  const text = await res.text().catch(() => '');
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch (err) { json = { _raw_text: text }; }

  if (!res.ok) {
    console.error('StayAPI error', res.status, {
      url: url.toString(),
      previewKey: previewKey(STAYAPI_KEY),
      bodyPreview: (typeof json === 'object' ? JSON.stringify(json).slice(0, 800) : text.slice(0, 800)),
    });
    const errMsg = json?.error?.message || json?.message || text || `HTTP ${res.status}`;
    const error = new Error(errMsg);
    error.status = res.status;
    error.body = json;
    throw error;
  }
  return json;
}

// ---------- Normalization helpers ----------
function extractArrayFromResponse(json) {
  if (!json) return [];
  if (Array.isArray(json.data)) return json.data;
  if (json.data && Array.isArray(json.data.hotels)) return json.data.hotels;
  if (Array.isArray(json)) return json;
  const common = ['results', 'items', 'hotels', 'hotel_list', 'data_list'];
  for (const k of common) {
    if (Array.isArray(json[k])) return json[k];
    if (json.data && Array.isArray(json.data[k])) return json.data[k];
  }
  for (const val of Object.values(json)) {
    if (Array.isArray(val)) return val;
  }
  return [];
}

function baseNormalizeHotel(item, normalizedQuery = '') {
  const id = String(item.hotel_id || item.id || item.place_id || Math.random());
  const name = item.hotel_name || item.name || item.title || 'Unknown hotel';
  const rawPrice = item.price ?? item.raw?.price ?? item.price_info ?? null;
  const minTotal = item.min_total_price ?? null;
  const imageUrl = item.image_url || item.thumbnail || (item.photos && item.photos[0]) || 'https://picsum.photos/seed/hotel-fallback/800/600';
  const address = item.address || item.display_location || item.location || normalizedQuery || null;
  const rating = (item.rating?.score ?? item.review_score ?? null);
  const reviewCount = (item.rating?.review_count ?? item.review_count ?? 0);
  const amenities = Array.isArray(item.amenities) ? item.amenities : [];
  return {
    id,
    name,
    rawPrice,
    minTotal,
    location: address,
    imageUrl,
    rating,
    reviewCount,
    amenities,
    raw: item
  };
}

// ---------- Express app ----------
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API server is running', previewKey: previewKey(STAYAPI_KEY) });
});

// GET /api/hotels
app.get('/api/hotels', async (req, res) => {
  try {
    const city = req.query.city || 'Da Nang';
    const checkin = req.query.checkin || '2025-12-01';
    const checkout = req.query.checkout || '2025-12-03';
    const adults = req.query.adults || '2';
    const rooms = req.query.rooms || '1';
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(req.query.per_page) || 20));
    const cacheKey = `hotels:${city}:${checkin}:${checkout}:${adults}:${rooms}:${page}:${perPage}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    let destResp;
    try {
      destResp = await stayGet('/booking/destinations/lookup', { query: city, language: 'en-us' });
    } catch (err) {
      console.error('Dest lookup failed:', err?.message || err);
      return res.status(err.status || 500).json({ hotels: [], count: 0, error: err.message || 'Dest lookup failed' });
    }
    const destId = destResp.dest_id || destResp.data?.dest_id || destResp.id;
    const destType = destResp.dest_type || destResp.data?.dest_type || 'CITY';
    const normalizedQuery = destResp.normalized_query || destResp.data?.normalized_query || city;
    if (!destId) return res.status(200).json({ hotels: [], count: 0, message: 'Không tìm thấy điểm đến phù hợp' });

    let searchResp;
    try {
      searchResp = await stayGet('/booking/search', {
        dest_id: destId,
        dest_type: destType,
        checkin,
        checkout,
        adults,
        rooms,
        currency: 'USD',
        language: 'en-us',
        rows_per_page: perPage,
        page
      });
    } catch (err) {
      console.error('StayAPI /booking/search failed:', err?.status || '', err?.message || err);
      if (err.status === 429) {
        const fallback = getCache(cacheKey);
        if (fallback) return res.json({ ...fallback, cached: true });
      }
      return res.status(err.status || 500).json({ hotels: [], count: 0, error: err.body ?? err.message ?? 'StayAPI error' });
    }

    let rawHotels = extractArrayFromResponse(searchResp);
    if ((!rawHotels || rawHotels.length === 0) && searchResp.data && Array.isArray(searchResp.data.results)) rawHotels = searchResp.data.results;
    if (!rawHotels || rawHotels.length === 0) {
      if (searchResp.hotels && Array.isArray(searchResp.hotels)) rawHotels = searchResp.hotels;
    }

    const usdToVnd = await getUsdToVndRate().catch(() => Number(process.env.USD_TO_VND || 24000));

    const hotels = rawHotels.map(item => {
      const base = baseNormalizeHotel(item, normalizedQuery);
      let priceNumber = null;
      let currency = null;
      const rp = base.rawPrice;
      if (rp) {
        if (rp.amount != null && rp.amount !== '') {
          const numeric = Number(String(rp.amount).replace(/[^0-9.-]+/g, ''));
          if (Number.isFinite(numeric)) priceNumber = numeric;
        }
        if (!priceNumber && rp.value != null) {
          const numeric = Number(String(rp.value).replace(/[^0-9.-]+/g, ''));
          if (Number.isFinite(numeric)) priceNumber = numeric;
        }
        currency = rp.currency || rp.curr || rp.code || null;
      }
      if (priceNumber === null && base.minTotal != null) {
        const n = Number(base.minTotal);
        if (Number.isFinite(n)) priceNumber = n;
      }
      if (priceNumber === null) {
        const maybe = item.priceNumber ?? item.min_total_price ?? item.price;
        if (maybe != null) {
          const n = Number(String(maybe).replace(/[^0-9.-]+/g, ''));
          if (Number.isFinite(n)) priceNumber = n;
        }
      }

      const priceDisplayFromApi = (rp && rp.display) || item.priceDisplay || (rp && rp.amount ? String(rp.amount) : null);
      let priceVndNumber = null;
      let priceVndDisplay = null;
      if (currency && typeof currency === 'string') currency = currency.toUpperCase();
      if (currency === 'USD' && priceNumber != null) {
        priceVndNumber = Math.round(priceNumber * usdToVnd);
        priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
      } else if ((currency === 'VND' || currency === 'VNĐ' || currency === '₫') && priceNumber != null) {
        priceVndNumber = Math.round(priceNumber);
        priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
      } else if (!currency && priceNumber != null) {
        priceVndNumber = Math.round(priceNumber * usdToVnd);
        priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
      }
      const finalPriceDisplay = priceVndDisplay ?? priceDisplayFromApi ?? (priceNumber != null ? String(priceNumber) : 'Liên hệ');

      return {
        id: base.id,
        name: base.name,
        location: base.location,
        imageUrl: base.imageUrl,
        rating: base.rating,
        reviewCount: base.reviewCount,
        amenities: base.amenities,
        priceNumber,
        priceDisplay: priceDisplayFromApi ?? null,
        priceVndNumber,
        priceVndDisplay,
        finalPriceDisplay,
        raw: base.raw
      };
    });

    const payload = { hotels, count: hotels.length, page, per_page: perPage, exchange_rate_usd_to_vnd: usdToVnd };
    setCache(cacheKey, payload, 20);
    try {
      const cacheDir = path.join(process.cwd(), 'stay_cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(path.join(cacheDir, encodeURIComponent(cacheKey) + '.json'), JSON.stringify(payload), 'utf8');
    } catch (e) { /* ignore */ }

    res.json(payload);
  } catch (err) {
    console.error('Error in /api/hotels:', err?.message || err);
    const status = err?.status || 500;
    return res.status(status).json({ hotels: [], count: 0, error: err?.message || 'Internal server error' });
  }
});

// GET /api/hotels/:id
app.get('/api/hotels/:id', async (req, res) => {
  try {
    const hotelId = req.params.id;
    if (!hotelId) return res.status(400).json({ error: 'Missing hotel id' });
    console.log('[DETAIL] request for hotel id=', hotelId);

    const buildFinal = async (item, normalizedQuery = '') => {
      const base = baseNormalizeHotel(item, normalizedQuery);
      const usdToVnd = await getUsdToVndRate().catch(() => Number(process.env.USD_TO_VND || 24000));
      let priceNumber = null;
      let currency = null;
      const rp = base.rawPrice;
      if (rp) {
        if (rp.amount != null && rp.amount !== '') {
          const numeric = Number(String(rp.amount).replace(/[^0-9.-]+/g, ''));
          if (Number.isFinite(numeric)) priceNumber = numeric;
        }
        if (!priceNumber && rp.value != null) {
          const numeric = Number(String(rp.value).replace(/[^0-9.-]+/g, ''));
          if (Number.isFinite(numeric)) priceNumber = numeric;
        }
        currency = rp.currency || rp.curr || rp.code || null;
      }
      if (priceNumber === null && base.minTotal != null) {
        const n = Number(base.minTotal);
        if (Number.isFinite(n)) priceNumber = n;
      }
      if (priceNumber === null) {
        const maybe = base.raw?.priceNumber ?? base.raw?.min_total_price ?? base.raw?.price;
        if (maybe != null) {
          const n = Number(String(maybe).replace(/[^0-9.-]+/g, ''));
          if (Number.isFinite(n)) priceNumber = n;
        }
      }
      if (currency && typeof currency === 'string') currency = currency.toUpperCase();
      let priceVndNumber = null;
      let priceVndDisplay = null;
      const priceDisplayFromApi = (rp && rp.display) || base.raw?.priceDisplay || (rp && rp.amount ? String(rp.amount) : null);
      if (currency === 'USD' && priceNumber != null) {
        priceVndNumber = Math.round(priceNumber * usdToVnd);
        priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
      } else if ((currency === 'VND' || currency === 'VNĐ' || currency === '₫') && priceNumber != null) {
        priceVndNumber = Math.round(priceNumber);
        priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
      } else if (!currency && priceNumber != null) {
        priceVndNumber = Math.round(priceNumber * usdToVnd);
        priceVndDisplay = `${priceVndNumber.toLocaleString('vi-VN')} ₫`;
      }
      const finalPriceDisplay = priceVndDisplay ?? priceDisplayFromApi ?? (priceNumber != null ? String(priceNumber) : 'Liên hệ');
      return {
        id: base.id,
        name: base.name,
        location: base.location,
        imageUrl: base.imageUrl,
        rating: base.rating,
        reviewCount: base.reviewCount,
        amenities: base.amenities,
        priceNumber,
        priceDisplay: priceDisplayFromApi ?? null,
        priceVndNumber,
        priceVndDisplay,
        finalPriceDisplay,
        raw: base.raw
      };
    };

    // 1) try booking/hotel_info
    try {
      const infoResp = await stayGet('/booking/hotel_info', { hotel_id: hotelId, language: 'en-us', currency: 'VND' });
      console.log('[DETAIL] booking/hotel_info preview:', JSON.stringify(infoResp).slice(0,400));
      const item = infoResp.data || infoResp.hotel || infoResp;
      if (item && typeof item === 'object') {
        const hotel = await buildFinal(item, item.display_location || '');
        return res.json(hotel);
      }
    } catch (e) {
      console.warn('[DETAIL] booking/hotel_info failed:', e?.message || e);
    }

    // 2) fallback /hotel/search-by-id
    try {
      const fb = await stayGet('/hotel/search-by-id', { id: hotelId, currency: 'VND' });
      console.log('[DETAIL] /hotel/search-by-id preview:', JSON.stringify(fb).slice(0,400));
      const item = fb.data || fb.hotel || fb;
      if (item && typeof item === 'object') {
        const hotel = await buildFinal(item, item.display_location || '');
        return res.json(hotel);
      }
    } catch (e) {
      console.warn('[DETAIL] /hotel/search-by-id failed:', e?.message || e);
    }

    // 3) try search by city if provided
    const tryFindByCity = async () => {
      const city = req.query.city || req.query.destination || null;
      if (!city) return null;
      try {
        const dest = await stayGet('/booking/destinations/lookup', { query: city, language: 'en-us' });
        const destId = dest.dest_id || dest.data?.dest_id;
        if (!destId) return null;
        const search = await stayGet('/booking/search', { dest_id: destId, dest_type: dest.dest_type || 'CITY', rows_per_page: 100, page: 1, checkin: '2025-12-01', checkout: '2025-12-02', currency: 'VND', language: 'en-us' });
        const arr = extractArrayFromResponse(search);
        const found = (arr || []).find(x => String(x.hotel_id || x.id) === String(hotelId));
        return found || null;
      } catch (e) {
        console.warn('[DETAIL] tryFindByCity failed', e?.message || e);
        return null;
      }
    };

    const foundByCity = await tryFindByCity();
    if (foundByCity) {
      try {
        const hotelObj = await buildFinal(foundByCity, foundByCity.display_location || '');
        return res.json(hotelObj);
      } catch (e) {
        console.warn('[DETAIL] buildFinal on foundByCity failed', e?.message || e);
      }
    }

    // 4) last resort: search all and find
    try {
      const searchResp = await stayGet('/booking/search', { rows_per_page: 50, page: 1, currency: 'VND' });
      const arr = extractArrayFromResponse(searchResp);
      const found = (arr || []).find(x => String(x.hotel_id || x.id) === String(hotelId));
      if (found) {
        const hotel = await buildFinal(found, found.display_location || '');
        return res.json(hotel);
      }
    } catch (e) {
      console.warn('[DETAIL] fallback search failed:', e?.message || e);
    }

    return res.status(404).json({ error: "Hotel detail fetch failed", detail: "Not Found in all endpoints" });
  } catch (err) {
    console.error('[DETAIL] Unexpected error:', err);
    return res.status(500).json({ error: err?.message || 'internal error' });
  }
});

// POST /api/bookings
app.post('/api/bookings', async (req, res) => {
  try {
    const body = req.body || {};
    const hotelId = body.hotelId || body.hotel_id || body.hotel || null;
    const checkin = body.checkin || body.checkInDate || body.check_in_date || null;
    const checkout = body.checkout || body.checkOutDate || body.check_out_date || null;
    const guestsRaw = body.guests ?? body.adults ?? body.numGuests ?? null;
    const guests = guestsRaw != null ? Number(guestsRaw) : null;

    if (!hotelId) return res.status(400).json({ success: false, error: 'Missing hotelId' });
    if (!checkin) return res.status(400).json({ success: false, error: 'Missing checkin' });
    if (!checkout) return res.status(400).json({ success: false, error: 'Missing checkout' });
    if (!guests) return res.status(400).json({ success: false, error: 'Missing guests' });

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (Number.isNaN(checkinDate.getTime()) || Number.isNaN(checkoutDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use yyyy-mm-dd or ISO date.' });
    }
    if (checkoutDate <= checkinDate) {
      return res.status(400).json({ success: false, error: 'Checkout must be after checkin' });
    }

    const bedType = body.bedType || body.bed_type || null;
    const unitPrice = body.unitPrice ?? body.unit_price ?? null;
    const totalPrice = body.totalPrice ?? body.total_price ?? null;
    const nights = body.nights ?? Math.max(1, Math.ceil((checkoutDate - checkinDate) / (24*60*60*1000)));

    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.createHash('sha1').update(Date.now() + Math.random().toString()).digest('hex');

    const booking = {
      id,
      hotelId,
      hotelName: body.hotelName || body.hotel_name || null,
      providerUrl: body.providerUrl || body.provider_url || null,
      checkin: checkinDate.toISOString().slice(0,10),
      checkout: checkoutDate.toISOString().slice(0,10),
      guests,
      bedType,
      nights,
      unitPrice,
      totalPrice,
      raw: body.raw || null,
      status: 'provisional',
      createdAt: new Date().toISOString()
    };

    const bookingsPath = path.join(process.cwd(), 'stay_bookings.json');
    let arr = [];
    try {
      if (fs.existsSync(bookingsPath)) {
        const txt = fs.readFileSync(bookingsPath, 'utf8');
        arr = JSON.parse(txt || '[]');
      }
    } catch (e) {
      console.warn('Could not read bookings file', e?.message || e);
      arr = [];
    }
    arr.unshift(booking);
    try {
      fs.writeFileSync(bookingsPath, JSON.stringify(arr.slice(0, 1000), null, 2), 'utf8');
    } catch (e) {
      console.warn('Could not write bookings file', e?.message || e);
    }

    const normalizedProvider = normalizeProviderUrlServer(booking.providerUrl, booking.hotelName);
    return res.json({ success: true, id: booking.id, provider_url: normalizedProvider, booking });
  } catch (err) {
    console.error('Error in /api/bookings:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`✅ API server listening on http://localhost:${PORT}`);
  console.log('StayAPI preview key:', previewKey(STAYAPI_KEY));
});
