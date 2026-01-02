import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// If your Node < 18 and don't have global fetch, uncomment the next line:
// import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import crypto from 'crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import partnerRouter from './routes/partner.js';
import uploadRouter from './routes/upload.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import communityRouter from './routes/community.js';
import chatRouter from './routes/chat.js';
import reviewsRouter from './routes/reviews.js';  // Import Review Router
import bookingRouter from './routes/bookings.js'; // Import Booking Router
import PartnerService from './models/PartnerService.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Serve static files from uploads directory (Robust path resolution)
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  console.log('Creating uploads directory at:', uploadsPath);
  fs.mkdirSync(uploadsPath, { recursive: true });
}
console.log('Serving uploads from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

app.use('/api/partner', partnerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
// app.use('/api/upload', uploadRouter); // Duplicate removed
app.use('/api/auth', authRouter);
import usersRouter from './routes/users.js';
app.use('/api/users', usersRouter);
app.use('/api/community', communityRouter);
app.use('/api/reviews', reviewsRouter); // Mount Reviews Route
app.use('/api/bookings', bookingRouter); // Mount Booking Actions (Cancel, etc)

// Specific route for Story creation directly under /api because frontend calls /api/stories
// We can alias it or update frontend. The frontend calls apiClient.post('/stories', ...)
// which becomes /api/stories. So we should mount the specific stories handler or use the router.
// Given community.js handles POST /stories (relative to router), mounting it at /api/community means 
// the endpoint is /api/community/stories.
// BUT frontend calls /api/stories directly.
// OPTION 1: Update frontend to use /api/community/stories
// OPTION 2: Mount router at /api so /stories works, but then /hub becomes /api/hub which might conflict if not careful.
// OPTION 3: Extract story routes or just add a direct alias here.

// Let's check community.js again. It defines router.post('/stories', ...).
// If we mount at /api/community, it becomes /api/community/stories.
// If we mount at /api, it becomes /api/stories.
// Let's mount at /api/community AND explicitly handle the /api/stories alias or change frontend.
// Changing frontend is cleaner for long term, but user asked to fix error.
// The frontend uses: apiClient.get('/community/hub') -> /api/community/hub
// AND apiClient.post('/stories') -> /api/stories.

// Ideally we group them. Let's redirect or just mount specifically.
app.use('/api', communityRouter); // This will match /api/stories and /api/hub (if community.js has /hub)
app.use('/api/chat', chatRouter);

// ---------- Database Connection ----------
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
  console.warn('⚠️ MONGODB_URI not found in .env');
}

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




// ---------- Routes (Application initialized at top) ----------

// Health
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API server is running (Local Database Mode)' });
});

// GET /api/hotels
app.get('/api/hotels', async (req, res) => {
  try {
    const {
      city,
      minPrice,
      maxPrice,
      ratings,
      amenities,
      sortBy,
      page = 1,
      per_page = 20
    } = req.query;

    const query = { type: 'hotel', status: 'active' };

    // 1. Filter by City
    if (city) {
      // Case-insensitive regex search
      query.$or = [
        { city: { $regex: city, $options: 'i' } },
        { location: { $regex: city, $options: 'i' } },
        { address: { $regex: city, $options: 'i' } },
        { name: { $regex: city, $options: 'i' } }
      ];
    }

    // 2. Filter by Price
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 3. Filter by Rating (0-5 scale or stars)
    if (ratings) {
      const ratingValues = ratings.split(',').map(Number);
      if (ratingValues.length > 0) {
        const minRating = Math.min(...ratingValues);
        query.rating = { $gte: minRating };
      }
    }

    // 4. Filter by Amenities (mapped to facilities)
    if (amenities) {
      const amenityList = amenities.split(',');
      if (amenityList.length > 0) {
        query.facilities = { $all: amenityList };
      }
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(per_page)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sort = {};
    if (sortBy === 'price_asc') sort.price = 1;
    else if (sortBy === 'price_desc') sort.price = -1;
    else if (sortBy === 'rating_desc') sort.rating = -1;
    else sort.createdAt = -1;

    // Execution
    const total = await PartnerService.countDocuments(query);
    const hotelsDb = await PartnerService.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Format for frontend (matching IHotel interface)
    const hotels = hotelsDb.map(h => ({
      id: h._id,
      name: h.name,
      location: h.location || h.address || '',
      imageUrl: h.image || (h.images && h.images[0]) || 'https://picsum.photos/seed/hotel-fallback/800/600',
      rating: h.rating,
      reviewCount: 0, // Not strictly in PartnerService yet, strictly speaking
      amenities: h.facilities || [],

      // Price fields
      priceNumber: h.price,
      price: { amount: h.price, currency: 'VND' },

      // Detail fields
      images: h.images && h.images.length ? h.images.map(url => ({ url })) : [{ url: h.image }],
      description: h.description,

      raw: h
    }));

    return res.json({
      hotels,
      count: total,
      page: pageNum,
      per_page: limitNum,
      total_pages: Math.ceil(total / limitNum)
    });

  } catch (err) {
    console.error('Error in /api/hotels:', err);
    return res.status(500).json({ hotels: [], count: 0, error: err.message });
  }
});

// GET /api/hotels/:id
app.get('/api/hotels/:id', async (req, res) => {
  try {
    const hotelId = req.params.id;
    if (!hotelId) return res.status(400).json({ error: 'Missing hotel id' });

    const hotel = await PartnerService.findById(hotelId);
    if (!hotel || hotel.type !== 'hotel') {
      return res.status(404).json({ error: "Hotel not found" });
    }

    // Format response
    const result = {
      id: hotel._id,
      name: hotel.name,
      location: hotel.location || hotel.address,
      imageUrl: hotel.image || (hotel.images && hotel.images[0]) || '',
      rating: hotel.rating,
      reviewCount: 0,
      amenities: hotel.facilities || [],
      description: hotel.description,

      // New fields
      checkInTime: hotel.checkInTime || '14:00',
      checkOutTime: hotel.checkOutTime || '12:00',
      maxGuests: hotel.maxGuests || 2,

      images: hotel.images && hotel.images.length ? hotel.images.map(url => ({ url })) : [{ url: hotel.image }],

      // Pricing
      priceNumber: hotel.price,
      priceVndNumber: hotel.price,
      priceDisplay: `${hotel.price.toLocaleString('vi-VN')} ₫`,
      finalPriceDisplay: `${hotel.price.toLocaleString('vi-VN')} ₫`,

      roomTypes: hotel.roomTypes || [],

      raw: hotel
    };

    return res.json(result);

  } catch (err) {
    console.error('[DETAIL] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/hotels/:id/availability
app.get('/api/hotels/:id/availability', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ success: false, error: 'Check-in and check-out dates are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const { default: Booking } = await import('./models/Booking.js');

    const hotel = await PartnerService.findById(hotelId);
    if (!hotel || hotel.type !== 'hotel') {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    // Valid room types
    const roomTypes = hotel.roomTypes || [];

    // Find confirmed bookings that overlap with the requested dates
    const existingBookings = await Booking.find({
      partnerService: hotelId,
      status: { $in: ['confirmed', 'pending', 'provisional'] },
      $or: [
        { checkInDate: { $lt: checkOutDate }, 'serviceInfo.checkOut': { $gt: checkInDate } }
      ]
    });

    // Calculate availability per room type
    const availability = roomTypes.map(room => {
      const totalRooms = room.quantity || 5; // Default quantity if not set

      // Count booked rooms of this type
      const bookedCount = existingBookings.filter(b =>
        (b.serviceInfo?.roomType === room.name)
      ).length;

      return {
        name: room.name,
        total: totalRooms,
        booked: bookedCount,
        available: Math.max(0, totalRooms - bookedCount)
      };
    });

    return res.json({ success: true, data: availability });

  } catch (err) {
    console.error('Error checking hotel availability:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/flights
app.get('/api/flights', async (req, res) => {
  try {
    const { from, to, date, maxPrice, airlines, page = 1 } = req.query;
    const query = { type: 'flight', status: 'active' };

    // 1. Search by Route (from/to)
    // We expect the 'route' field in PartnerService to contain "Hanoi - Danang" or similar
    if (from || to) {
      const parts = [];
      if (from) parts.push(from);
      if (to) parts.push(to);

      // Simple regex approach: if we have both, look for both; if one, look for one
      // This matches "Hanoi" and "Danang" regardless of order if we just want connectivity, 
      // but usually flights are directional.
      // Assuming 'route' string like "Hanoi - Danang"
      if (from && to) {
        query.route = { $regex: `${from}.*${to}`, $options: 'i' };
      } else if (from) {
        query.route = { $regex: from, $options: 'i' };
      } else if (to) {
        // This is loose, checking if 'to' is in the route string anywhere
        // Ideally we check after the hyphen, but keep it simple for now
        query.route = { $regex: to, $options: 'i' };
      }
    }

    // 2. Price
    if (maxPrice) {
      query.price = { $lte: Number(maxPrice) };
    }

    // 3. Airlines (filtering by Name)
    if (airlines) {
      const airlineList = airlines.split(',');
      if (airlineList.length > 0) {
        // Case insensitive match for any of the airlines
        query.name = { $in: airlineList.map(a => new RegExp(a, 'i')) };
      }
    }

    // Pagination
    const PAGE_SIZE = 12;
    const pageNum = Math.max(1, Number(page));
    const skip = (pageNum - 1) * PAGE_SIZE;

    const total = await PartnerService.countDocuments(query);
    const flightsDb = await PartnerService.find(query)
      .skip(skip)
      .limit(PAGE_SIZE);

    // Map to IFlight-like structure
    // Forced reload for model updates
    const flights = flightsDb.map(f => {
      // Try to parse route "Code - Code" or "City - City"
      // Fallback mock data if parsing fails
      let originCode = 'HAN';
      let destCode = 'SGN';
      let originCity = 'Hà Nội';
      let destCity = 'TP Hồ Chí Minh';

      if (f.route) {
        const parts = f.route.split('-').map(s => s.trim());
        if (parts.length >= 2) {
          originCity = parts[0];
          destCity = parts[1];
          // Mock codes based on city first 3 letters or random
          originCode = originCity.substring(0, 3).toUpperCase();
          destCode = destCity.substring(0, 3).toUpperCase();
        }
      }

      return {
        id: f._id,
        airline: f.name,
        flightNumber: `VN${Math.floor(Math.random() * 900) + 100}`,
        origin: {
          code: originCode,
          city: originCity,
          time: '08:00'
        },
        destination: {
          code: destCode,
          city: destCity,
          time: '10:00'
        },
        duration: '2h 00m',
        price: f.price,
        type: 'Non-stop',
        status: 'active',
        // Update mock logic: If strict stops filter exists, match it. Else random.
        stops: (() => {
          if (req.query.stops) {
            const allowed = req.query.stops.split(',').map(Number);
            return allowed[Math.floor(Math.random() * allowed.length)];
          }
          return Math.random() > 0.7 ? 1 : 0; // Mostly direct
        })(),
        // Update mock logic: If strict class filter exists, match it. Else random.
        class: (() => {
          if (req.query.classes) {
            const allowed = req.query.classes.split(',');
            return allowed[Math.floor(Math.random() * allowed.length)];
          }
          return Math.random() > 0.8 ? 'Business' : 'Economy';
        })(),
        date: date || new Date().toISOString().split('T')[0]
      };
    });

    return res.json({
      success: true,
      data: flights,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / PAGE_SIZE)
    });

  } catch (err) {
    console.error('Error in /api/flights:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tours/:id
app.get('/api/tours/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Dynamic import
    const { default: Tour } = await import('./models/Tour.js');
    const { default: Review } = await import('./models/Review.js');
    const { default: Booking } = await import('./models/Booking.js'); // Ensure Booking loaded if needed

    // 1. Optional Auth to see own pending reviews
    let userId = null;
    try {
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
        userId = decoded.userId;
      } else if (req.headers.cookie) {
        const cookies = parse(req.headers.cookie);
        if (cookies['auth_token']) {
          const decoded = jwt.verify(cookies['auth_token'], process.env.JWT_SECRET || 'dev_secret_change_me');
          userId = decoded.userId;
        }
      }
    } catch (e) { /* ignore invalid token */ }

    // 2. Fetch Tour
    const tour = await Tour.findById(id).populate('destination').populate('owner', 'name avatar');
    if (!tour) return res.status(404).json({ success: false, error: 'Tour not found' });

    // 3. Fetch Reviews (Approved OR My Pending)
    const reviewQuery = { tour: id };
    if (userId) {
      reviewQuery.$or = [
        { status: 'approved' },
        { user: userId } // Include my reviews regardless of status
      ];
    } else {
      reviewQuery.status = 'approved';
    }

    const reviews = await Review.find(reviewQuery)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { tour, reviews } });

  } catch (error) {
    console.error('Error fetching tour detail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tours/:id/availability
app.get('/api/tours/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ error: 'Missing date parameter' });

    // Dynamic import to avoid top-level await in some environments if needed, but consistency with others
    const { default: Tour } = await import('./models/Tour.js');
    const { default: Booking } = await import('./models/Booking.js');

    const tour = await Tour.findById(id);
    if (!tour) return res.status(404).json({ error: 'Tour not found' });

    // Calculate start and end of the requested date
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Find all active bookings for this tour on this date
    // Note: checkInDate in Booking is defined. Ideally we should match exactly the date part.
    // MongoDB date match can be tricky with timezones, so using a range is safer.
    const bookings = await Booking.find({
      tour: id,
      status: { $nin: ['cancelled', 'rejected', 'failed'] },
      checkInDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    const bookedCount = bookings.reduce((sum, b) => sum + (b.participants || 0), 0);
    const maxGroupSize = tour.maxGroupSize || 0;
    const available = Math.max(0, maxGroupSize - bookedCount);

    return res.json({
      success: true,
      data: {
        date: date,
        maxGroupSize,
        bookedCount,
        available
      }
    });

  } catch (err) {
    console.error('Error checking tour availability:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Helper to escape regex special characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Helper to create flexible Vietnamese regex
function createVietnameseRegex(keyword) {
  if (!keyword) return '';

  // 1. Normalize to basic latin to separate base char from diacritics (optional, but easier to map)
  // But constructing the regex manually for common vowels is safer
  const str = keyword.toLowerCase().trim();
  let regexStr = '';

  for (let char of str) {
    if (['a', 'à', 'á', 'ạ', 'ả', 'ã', 'â', 'ầ', 'ấ', 'ậ', 'ẩ', 'ẫ', 'ă', 'ằ', 'ắ', 'ặ', 'ẳ', 'ẵ'].includes(char)) {
      regexStr += '[aàáạảãâầấậẩẫăằắặẳẵ]';
    } else if (['e', 'è', 'é', 'ẹ', 'ẻ', 'ẽ', 'ê', 'ề', 'ế', 'ệ', 'ể', 'ễ'].includes(char)) {
      regexStr += '[eèéẹẻẽêềếệểễ]';
    } else if (['i', 'ì', 'í', 'ị', 'ỉ', 'ĩ'].includes(char)) {
      regexStr += '[iìíịỉĩ]';
    } else if (['o', 'ò', 'ó', 'ọ', 'ỏ', 'õ', 'ô', 'ồ', 'ố', 'ộ', 'ổ', 'ỗ', 'ơ', 'ờ', 'ớ', 'ợ', 'ở', 'ỡ'].includes(char)) {
      regexStr += '[oòóọỏõôồốộổỗơờớợởỡ]';
    } else if (['u', 'ù', 'ú', 'ụ', 'ủ', 'ũ', 'ư', 'ừ', 'ứ', 'ự', 'ử', 'ữ'].includes(char)) {
      regexStr += '[uùúụủũưừứựửữ]';
    } else if (['y', 'ỳ', 'ý', 'ỵ', 'ỷ', 'ỹ'].includes(char)) {
      regexStr += '[yỳýỵỷỹ]';
    } else if (['d', 'đ'].includes(char)) {
      regexStr += '[dđ]';
    } else if (char === ' ') {
      regexStr += '\\s+'; // Flexible whitespace
    } else {
      regexStr += escapeRegex(char);
    }
  }
  return regexStr;
}

// GET /api/transport/:id/availability
app.get('/api/transport/:id/availability', async (req, res) => {
  try {
    const transportId = req.params.id;
    const { date, time } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    const { default: PartnerService } = await import('./models/PartnerService.js');
    const { default: Booking } = await import('./models/Booking.js');

    const pService = await PartnerService.findById(transportId);
    if (!pService || !['flight', 'train', 'bus'].includes(pService.type)) {
      return res.status(404).json({ success: false, error: 'Transport service not found' });
    }

    // Get ticket types - Fallback to roomTypes for backward compatibility/flexibility
    let ticketTypes = pService.ticketTypes || [];
    if (ticketTypes.length === 0 && pService.roomTypes && pService.roomTypes.length > 0) {
      ticketTypes = pService.roomTypes.map(r => ({
        name: r.name,
        price: r.price,
        quantity: r.quantity,
        class: 'Standard',
        _id: r._id
      }));
    }

    // Find confirmed bookings for this date and optionally time
    // Note: checkInDate in Booking schema is used as the travel date
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const query = {
      partnerService: transportId,
      status: { $in: ['confirmed', 'pending', 'provisional'] },
      checkInDate: { $gte: startOfDay, $lte: endOfDay }
    };

    // If time is provided, filter specifically for that time
    if (time) {
      query['serviceInfo.tripTime'] = time;
    }

    const existingBookings = await Booking.find(query);

    // Calculate availability per ticket class
    const availability = ticketTypes.map(ticket => {
      const totalSeats = ticket.quantity || 50; // Default seats

      // Sum participants for this ticket class
      let bookedSeats = 0;
      existingBookings.forEach(b => {
        // serviceInfo.class stores the ticket name/class
        // If time param is NOT provided, we might be over-counting if capacity is per-trip
        // Ideally, if no time provided, we should return map of all times? 
        // For now, let's assume client ALWAYS provides time for accurate check, 
        // or if not, it returns "globally available" which is risky but acceptable if assuming 1 trip/day

        // Strict class matching
        const bookingClass = b.serviceInfo?.class;
        const ticketName = ticket.name;

        if (bookingClass === ticketName || bookingClass === ticket.class) {
          bookedSeats += (b.participants || 1);
        }
      });

      return {
        _id: ticket._id,
        name: ticket.name,
        total: totalSeats,
        booked: bookedSeats,
        available: Math.max(0, totalSeats - bookedSeats)
      };
    });


    // Also calculate global availability if no ticket types
    let globalAvailable = null;
    if (ticketTypes.length === 0) {
      const totalSeats = pService.quantity || 50;
      const bookedSeats = existingBookings.reduce((sum, b) => sum + (b.participants || 1), 0);
      globalAvailable = Math.max(0, totalSeats - bookedSeats);

      // Synthesize a virtual ticket type to match GET /api/transport/:id behavior
      const defaultName = pService.type === 'flight' ? 'Vé máy bay phổ thông' :
        pService.type === 'bus' ? 'Vé xe khách' : 'Vé phổ thông';

      availability.push({
        name: defaultName,
        total: totalSeats,
        booked: bookedSeats,
        available: globalAvailable
      });
    }

    return res.json({ success: true, data: { ticketTypes: availability, globalAvailable } });

  } catch (err) {
    console.error('Error checking transport availability:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/transport (Generic search for Flight, Train, Bus)
app.get('/api/transport', async (req, res) => {
  try {
    const { type, from, to, date, page = 1 } = req.query;

    // Validate type
    if (!type || !['flight', 'train', 'bus'].includes(type)) {
      if (!type) {
        return res.status(400).json({ success: false, error: 'Transport type is required (flight, train, bus)' });
      }
    }

    const query = { type, status: 'active' };

    // Route matching with flexible Vietnamese regex
    if (from || to) {
      if (from && to) {
        // Create flexible regex for both parts
        const fromRegex = createVietnameseRegex(from);
        const toRegex = createVietnameseRegex(to);
        // Match "from ... to" with any characters in between
        query.route = { $regex: `${fromRegex}.*${toRegex}`, $options: 'i' };
      } else if (from) {
        query.route = { $regex: createVietnameseRegex(from), $options: 'i' };
      } else if (to) {
        query.route = { $regex: createVietnameseRegex(to), $options: 'i' };
      }
    }

    console.log(`[Transport Search] Type: ${type}, From: ${from}, To: ${to}, Query:`, JSON.stringify(query));

    const PAGE_SIZE = 20;
    const pageNum = Math.max(1, Number(page));
    const skip = (pageNum - 1) * PAGE_SIZE;

    const total = await PartnerService.countDocuments(query);
    const servicesDb = await PartnerService.find(query)
      .skip(skip)
      .limit(PAGE_SIZE);

    const services = servicesDb.map(s => {
      // Parse Route
      let depLoc = from || 'Điểm đi';
      let arrLoc = to || 'Điểm đến';
      if (s.route) {
        const parts = s.route.split('-').map(p => p.trim());
        if (parts.length >= 2) {
          depLoc = parts[0];
          arrLoc = parts[1];
        }
      }

      return {
        id: s._id,
        operator: s.name,
        logo: s.image,
        type: s.type, // flight, train, bus
        departure: {
          time: '08:00', // Mock
          station: depLoc,
          airport: depLoc // for flight compatibility
        },
        arrival: {
          time: '12:00', // Mock
          station: arrLoc,
          airport: arrLoc
        },
        duration: s.duration || '4h 00m', // Dynamic duration
        departureTimes: s.departureTimes || [], // Expose departure times
        price: s.price,
        class: 'Standard',
        raw: s
      };
    });

    return res.json({
      success: true,
      data: services,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / PAGE_SIZE)
    });

  } catch (err) {
    console.error('Error in /api/transport:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/transport/:id
app.get('/api/transport/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const service = await PartnerService.findById(id);
    if (!service || !['flight', 'train', 'bus'].includes(service.type)) {
      return res.status(404).json({ error: "Transport service not found" });
    }

    const result = {
      id: service._id,
      operator: service.name,
      type: service.type,
      logo: service.image || (service.images && service.images[0]) || '',
      images: service.images || [],
      description: service.description,

      // Route & Schedule
      route: service.route,
      departure: {
        time: '08:00', // Mock if not in DB
        station: service.route ? service.route.split('-')[0].trim() : 'Điểm đi'
      },
      arrival: {
        time: '12:00', // Mock
        station: service.route ? service.route.split('-')[1].trim() : 'Điểm đến'
      },
      duration: service.duration || '4h 00m',
      departureTimes: service.departureTimes || [], // EXPOSE THIS FIELD

      // Pricing & Tickets

      ticketTypes: (() => {
        if (service.ticketTypes && service.ticketTypes.length > 0) return service.ticketTypes;

        // Fallback to roomTypes if ticketTypes is empty (backward compatibility)
        if (service.roomTypes && service.roomTypes.length > 0) {
          return service.roomTypes.map(r => ({
            _id: r._id,
            name: r.name,
            price: r.price,
            class: 'Standard',
            description: r.description,
            quantity: r.quantity,
            amenities: r.amenities,
            images: r.images
          }));
        }

        // Default if no types defined
        const defaultName = service.type === 'flight' ? 'Vé máy bay phổ thông' :
          service.type === 'bus' ? 'Vé xe khách' : 'Vé phổ thông';

        return [{
          name: defaultName,
          price: service.price,
          class: 'Standard',
          description: 'Vé tiêu chuẩn',
          quantity: (service.quantity !== undefined && service.quantity !== null) ? service.quantity : 50
        }];
      })(),

      amenities: service.facilities || [],
      raw: service
    };

    return res.json({ success: true, data: result });

  } catch (err) {
    console.error('[Transport Detail] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings
// GET /api/users/profile
app.get('/api/users/profile', async (req, res) => {
  try {
    let userId = null;
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.cookie) {
      const cookies = parse(req.headers.cookie);
      token = cookies['auth_token'];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
        userId = decoded.userId;
      } catch (e) { }
    }

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { default: User } = await import('./models/User.js');
    const { default: Booking } = await import('./models/Booking.js');
    const { default: PartnerService } = await import('./models/PartnerService.js'); // Ensure Model is registered for populate

    // Find User
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Find Bookings (Journeys)
    const bookings = await Booking.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'partnerService',
        select: 'name image images status' // Only fetch needed fields
      })
      .populate('tour')
      .lean();

    console.log(`DEBUG: Found ${bookings.length} bookings for user ${userId}`);
    if (bookings.length > 0) {
      console.log('DEBUG: First Booking Sample:', JSON.stringify(bookings[0], null, 2));
    }

    const journeys = bookings.map(b => {
      // Determine Image - Prefer Live Partner Image -> Snapshot -> Tour Image
      let img = null;

      // 1. Try Live Partner Service Image (for Transport/Hotels)
      if (b.partnerService) {
        img = b.partnerService.image || (b.partnerService.images && b.partnerService.images[0]) || null;
      }

      // 2. Try Tour Live Image
      if (!img && b.tour) {
        img = b.tour.mainImage || null;
      }

      // 3. STRICT: Do NOT fallback to serviceInfo.image (Snapshot)
      // This ensures we only show images that exist in the PartnerService/Tour database.
      // If missing, img remains null.

      // Determine Destination/Location - Prefer serviceInfo.destination (Snapshot)
      let location = b.serviceInfo?.destination || 'Việt Nam';
      if (!b.serviceInfo?.destination) {
        if (b.type === 'tour' && b.tour?.destination?.name) location = b.tour.destination.name;
        else if (b.type === 'hotel' && b.partnerService) {
          location = b.partnerService.city || b.partnerService.location || b.partnerService.address;
        }
      }

      return {
        _id: b._id,
        tourTitle: b.serviceInfo?.title || b.tour?.title || b.partnerService?.name || 'Chuyến đi',
        bookingDate: b.bookingDate,
        checkInDate: b.checkInDate, // Added checkInDate for frontend logic
        status: b.status,
        totalPrice: b.totalPrice,
        participants: b.participants,
        mainImage: img,
        destination: location,
        type: b.type,
        tour: b.tour, // Pass full object
        partnerService: b.partnerService // Pass full object
      };
    });

    // Mock Gamification/Badges (since schemas might be complex or missing, providing Safe Defaults)
    const gamification = {
      earnedBadgesCount: 0,
      totalBadgesCount: 10,
      completionPercentage: 0,
      allBadges: [],
      categorizedBadges: []
    };

    // Mock Stories
    const stories = [];

    // Construct Payload
    const responsePayload = {
      profile: {
        name: user.name,
        avatarInitials: user.name ? user.name.charAt(0).toUpperCase() : 'U',
        memberSince: user.createdAt,
        level: 'Thành viên'
      },
      gamification,
      journeys,
      stories
    };

    return res.json({ success: true, data: responsePayload });

  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bookings (List user bookings)
app.get('/api/bookings', async (req, res) => {
  try {
    let userId = null;
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.cookie) {
      const cookies = parse(req.headers.cookie);
      token = cookies['auth_token'];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
        userId = decoded.userId;
      } catch (e) { }
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { default: Booking } = await import('./models/Booking.js');
    // Populate simple fields if needed, but for list usually basic info is enough
    const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });

    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bookings/:id (Booking detail)
// GET /api/bookings/:id (Booking detail)
app.get('/api/bookings/:id', requireAuth, async (req, res) => {
  console.log(`[GET /api/bookings/:id] Request received for ID: ${req.params.id}`);

  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Dynamic import to avoid circular deps or startup overhead
    const { default: Booking } = await import('./models/Booking.js');

    const booking = await Booking.findOne({ _id: id, user: userId })
      .populate('tour')
      .populate('partnerService'); // Ensure populated data for display

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    return res.json({ success: true, data: booking });

  } catch (err) {
    console.error('Error fetching booking detail:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/bookings/:id/cancel (Cancel booking)
app.patch('/api/bookings/:id/cancel', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const { default: Booking } = await import('./models/Booking.js');

    const booking = await Booking.findOne({ _id: id, user: userId });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, error: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    return res.json({ success: true, data: booking });

  } catch (err) {
    console.error('Error cancelling booking:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bookings
app.post('/api/bookings', async (req, res) => {
  try {
    const body = req.body || {};
    // Polymorphic ID extraction
    const hotelId = body.hotelId || body.hotel_id || body.hotel || null;
    const tourId = body.tourId || body.tour_id || body.tour || null;

    // Common fields
    let userId = body.userId || null;
    const checkin = body.checkin || body.checkInDate || body.check_in_date || body.bookingDate || null;
    // For tours, checkout might be null or same day+duration
    const checkout = body.checkout || body.checkOutDate || body.check_out_date || null;

    // Validate Date (Prevent booking in past)
    if (checkin) {
      const checkInDate = new Date(checkin);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (checkInDate < today) {
        return res.status(400).json({ success: false, error: 'Ngày khởi hành không được ở trong quá khứ.' });
      }
    }

    // Guests
    const guestsRaw = body.guests ?? body.adults ?? body.numGuests ?? body.participants ?? null;
    const guests = guestsRaw != null ? Number(guestsRaw) : null;

    // Robust Auth: Try to get userId from Token if not in body
    if (!userId) {
      try {
        let token = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          token = req.headers.authorization.split(' ')[1];
        } else if (req.headers.cookie) {
          const cookies = parse(req.headers.cookie);
          token = cookies['auth_token'];
        }

        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
          if (decoded && decoded.userId) {
            userId = decoded.userId;
            // Auto-fix body for consistency
            body.userId = userId;
          }
        }
      } catch (e) {
        console.warn('[Booking] Token extraction failed:', e.message);
      }
    }

    if (!userId) {
      console.error('[Booking Error] No userId found in body or token');
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập để đặt dịch vụ' });
    }

    // Validation
    if (!hotelId && !tourId && !['flight', 'train', 'bus'].includes(body.type)) {
      return res.status(400).json({ success: false, error: 'Missing service identifier (hotelId, tourId or type=flight/train/bus)' });
    }
    if (!guests) return res.status(400).json({ success: false, error: 'Missing participants/guests count' });

    // Lazy Import Models
    const { default: Booking } = await import('./models/Booking.js');
    const { default: User } = await import('./models/User.js');
    const { default: Notification } = await import('./models/Notification.js');

    let newBookingData = {
      user: userId,
      bookingDate: new Date(),
      participants: guests,
      participantsBreakdown: {
        adults: guests,
        children: 0
      },
      contactInfo: {
        name: body.contactName || body.customerInfo?.name || '',
        email: body.contactEmail || body.customerInfo?.email || '',
        phone: body.contactPhone || body.customerInfo?.phone || ''
      },
      paymentMethod: body.paymentMethod || 'cash',
      status: 'pending', // Default
      totalPrice: Number(body.totalPrice || 0)
    };

    // ----- HOTEL LOGIC -----
    if (hotelId) {
      const hotel = await PartnerService.findById(hotelId);
      if (!hotel) return res.status(404).json({ success: false, error: 'Hotel not found' });

      // CRITICAL: Status Check
      if (hotel.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Khách sạn này hiện đang tạm ngưng hoạt động.' });
      }

      if (!checkin) return res.status(400).json({ success: false, error: 'Missing checkin date for hotel' });
      if (!checkout) return res.status(400).json({ success: false, error: 'Missing checkout date for hotel' });

      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      const nights = body.nights ?? Math.max(1, Math.ceil((checkoutDate - checkinDate) / (24 * 60 * 60 * 1000)));

      // --- SECURITY FIX: Resolve Price from DB ---
      const requestedRoomType = body.bedType || body.roomType || 'Standard';
      let officialPrice = hotel.price;

      // Try to find specific room price
      if (hotel.roomTypes && hotel.roomTypes.length > 0) {
        const room = hotel.roomTypes.find(r => r.name === requestedRoomType) || hotel.roomTypes[0]; // Fallback to first if mismatch (conceptually 'Standard')
        if (room) officialPrice = room.price;
      }

      // Calculate Total: Price * Nights * Rooms (Default 1 room)
      const numRooms = Number(body.rooms || body.quantity || 1);
      const finalTotalPrice = officialPrice * nights * numRooms;

      // CRITICAL: Inventory Check
      // Count active bookings for this roomType intersecting the requested dates
      const existingBookings = await Booking.find({
        partnerService: hotelId,
        status: { $in: ['confirmed', 'pending', 'provisional'] },
        'serviceInfo.roomType': requestedRoomType,
        $or: [
          { checkInDate: { $lt: checkoutDate }, 'serviceInfo.checkOut': { $gt: checkinDate } }
        ]
      });
      // Assuming existingBookings just counts 1 per booking, but if booking has multiple rooms? 
      // Current system seems to treat 1 booking = 1 room unit usually, or we need to sum 'quantity'.
      // Looking at schema, Booking doesn't have 'quantity' for rooms explicitly, usually implied 1 or encoded.
      // Let's assume 1 booking = 1 room for now (safest for MVP). 
      const roomsBooked = existingBookings.length;

      // Find total quantity for this room type
      let totalRooms = hotel.quantity || 5;
      if (hotel.roomTypes) {
        const r = hotel.roomTypes.find(rt => rt.name === requestedRoomType);
        if (r) totalRooms = r.quantity || 5;
      }

      if (roomsBooked + numRooms > totalRooms) {
        return res.status(400).json({
          success: false,
          error: `Loại phòng '${requestedRoomType}' đã hết chỗ trong khoảng thời gian này.`
        });
      }
      // -------------------------------------------

      newBookingData = {
        ...newBookingData,
        type: 'hotel',
        partnerService: hotelId,
        status: 'provisional', // Hotels often start provisional
        totalPrice: finalTotalPrice, // Secure Overwrite
        serviceInfo: {
          title: hotel.name,
          image: hotel.image || (hotel.images && hotel.images[0]) || '',
          destination: hotel.location || hotel.address || hotel.city || 'Việt Nam',
          price: officialPrice, // Secure Overwrite
          checkIn: checkinDate,
          checkOut: checkoutDate,
          nights,
          roomType: requestedRoomType,
          providerUrl: body.providerUrl || null
        },
        checkInDate: checkinDate
      };
    }
    // ----- TRANSPORT LOGIC (Flight/Train/Bus) -----
    else if (['flight', 'train', 'bus'].includes(body.type)) {
      let serviceTitle = 'Vé di chuyển';
      let serviceImage = '';
      let linkedServiceId = null;
      let officialPrice = 0; // Default
      const requestedTime = body.departureTime;
      const requestedClass = body.class || 'Standard';
      let ticketQuantity = 50; // Default

      console.log('DEBUG: Transport Booking Request:', {
        transportNumber: body.transportNumber,
        type: body.type
      });

      // Try to find the PartnerService if a generic ID is provided
      if (body.transportNumber && body.transportNumber.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          const pService = await PartnerService.findById(body.transportNumber).select('name image images status price ticketTypes departureTimes quantity');

          if (pService) {
            // CRITICAL: Status Check
            if (pService.status !== 'active') {
              return res.status(400).json({ success: false, error: 'Dịch vụ vận chuyển này hiện đang tạm ngưng hoạt động.' });
            }

            console.log('DEBUG: SUCCESS - Found PartnerService:', { id: pService._id, name: pService.name });

            // Link and Snapshot
            linkedServiceId = pService._id;
            serviceTitle = `${pService.name} (${body.transportNumber})`;
            serviceImage = pService.image || (pService.images && pService.images[0]);
            officialPrice = pService.price;
            ticketQuantity = pService.quantity || 50;

            // --- SECURITY FIX: Resolve Price from DB ---
            if (pService.ticketTypes && pService.ticketTypes.length > 0) {
              const ticket = pService.ticketTypes.find(t => t.name === requestedClass || t.class === requestedClass);
              if (ticket) {
                officialPrice = ticket.price;
                ticketQuantity = ticket.quantity || 50;
              }
            }

            // --- DEPARTURE TIME CHECK ---
            if (pService.departureTimes && pService.departureTimes.length > 0) {
              if (!requestedTime || !pService.departureTimes.includes(requestedTime)) {
                return res.status(400).json({
                  success: false,
                  error: `Vui lòng chọn giờ khởi hành hợp lệ (${pService.departureTimes.join(', ')}).`
                });
              }

              // Past Time Check
              const tripDate = new Date(body.bookingDate || Date.now());
              const now = new Date();
              const isToday = tripDate.toDateString() === now.toDateString();

              if (isToday) {
                const [h, m] = requestedTime.split(':').map(Number);
                const requestDate = new Date(now);
                requestDate.setHours(h, m, 0, 0);
                const cutoffTime = new Date(now.getTime() + 60 * 60 * 1000); // Now + 1 hour

                if (requestDate < cutoffTime) {
                  return res.status(400).json({
                    success: false,
                    error: `Đã hết thời gian đặt vé cho chuyến ${requestedTime} (Cần đặt trước ít nhất 1 tiếng).`
                  });
                }
              }
            }
          } else {
            console.log('DEBUG: FAIL - PartnerService ID valid format but not found in DB:', body.transportNumber);
          }
        } catch (dbErr) {
          console.error('DEBUG: ERROR probing PartnerService:', dbErr);
        }
      } else {
        console.log('DEBUG: SKIP - transportNumber not a valid ObjectId:', body.transportNumber);
      }

      // Fallback title construction (if not linked)
      if (!linkedServiceId) {
        // STRICT SECURITY: Reject unlinked transport bookings
        // We do NOT trust client-side price for transport.
        return res.status(400).json({
          success: false,
          error: 'Dịch vụ vận chuyển không hợp lệ hoặc không tồn tại trong hệ thống. Vui lòng thử lại.'
        });
      }

      // CRITICAL: Inventory Check (Active Bookings)
      // Done outside try/catch to cover both Linked and Unlinked (though unlinked usually has no capacity check)
      if (linkedServiceId) {
        const tripDateStart = new Date(body.bookingDate || Date.now());
        tripDateStart.setHours(0, 0, 0, 0);
        const tripDateEnd = new Date(tripDateStart);
        tripDateEnd.setHours(23, 59, 59, 999);

        const bookingQuery = {
          partnerService: linkedServiceId,
          status: { $in: ['confirmed', 'pending', 'provisional'] },
          checkInDate: { $gte: tripDateStart, $lte: tripDateEnd }
        };

        if (requestedTime) {
          bookingQuery['serviceInfo.tripTime'] = requestedTime;
        }

        const bookedSeatsCount = await Booking.find(bookingQuery).then(bk => bk.reduce((sum, b) => {
          if (b.serviceInfo?.class === requestedClass) return sum + (b.participants || 1);
          return sum;
        }, 0));

        if (bookedSeatsCount + guests > ticketQuantity) {
          return res.status(400).json({
            success: false,
            error: `Loại vé '${requestedClass}' đã hết chỗ (Khả dụng: ${ticketQuantity - bookedSeatsCount}).`
          });
        }
      }

      const finalTotalPrice = officialPrice * guests;

      newBookingData = {
        ...newBookingData,
        type: body.type,
        partnerService: linkedServiceId, // Link if found
        checkInDate: new Date(body.bookingDate || Date.now()),
        totalPrice: finalTotalPrice,
        serviceInfo: {
          title: serviceTitle,
          destination: body.destination?.city || 'Việt Nam',
          price: officialPrice,
          image: serviceImage || null, // STRICT: No fallback image
          location: `${body.origin?.city || body.origin?.station || ''} - ${body.destination?.city || body.destination?.station || ''}`,
          duration: body.duration,
          bookingDate: body.bookingDate,
          class: requestedClass,
          tripTime: requestedTime || body.time || "00:00"
        },
        participants: guests
      };
    }
    // ----- TOUR LOGIC -----
    else if (tourId) {
      // Since Tour model isn't imported globally, try to dynamic import or rely on Mongoose
      // Assuming 'Tour' model is registered. 
      // If not, we might need: const { default: Tour } = await import('./models/Tour.js');
      // But assuming generic handling for now or simple ID check if we don't strictly validate Tour existence (though we should)

      // For now, trust the ID but try to fetch title from body if model not avail
      let tourTitle = body.tourName || body.title || 'Tour tham quan';
      let tourImage = body.tourImage || null;

      let tourDestination = 'Việt Nam';

      try {
        const { default: Tour } = await import('./models/Tour.js');
        const { default: Booking } = await import('./models/Booking.js'); // Ensure Booking is linked

        const tour = await Tour.findById(tourId);
        if (tour) {
          tourTitle = tour.title;
          tourImage = tour.mainImage;
          tourDestination = tour.destination?.name || tour.location || 'Việt Nam';

          // --- SECURITY FIX: Validate Start Date ---
          const requestedYMD = new Date(checkin || Date.now()).toISOString().split('T')[0];
          // Check if tour has restricted start dates
          if (tour.start_dates && tour.start_dates.length > 0) {
            const isValidDate = tour.start_dates.some(d => new Date(d).toISOString().split('T')[0] === requestedYMD);
            if (!isValidDate) {
              return res.status(400).json({ success: false, error: 'Ngày này tour không tổ chức. Vui lòng chọn ngày khác trong lịch khởi hành.' });
            }
          }

          // --- CRITICAL FIX: Overbooking Protection ---
          // 1. Determine Start/End of the requested date
          const requestedDate = new Date(checkin || Date.now());
          const startOfDay = new Date(requestedDate); startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(requestedDate); endOfDay.setHours(23, 59, 59, 999);

          // 2. Count existing participants for this Tour on this Date
          const existingBookings = await Booking.find({
            tour: tourId,
            status: { $in: ['confirmed', 'pending', 'provisional'] }, // Count pending to avoid race conditions
            checkInDate: { $gte: startOfDay, $lte: endOfDay }
          });

          const currentPax = existingBookings.reduce((sum, b) => sum + (b.participants || 0), 0);
          const groupLimit = tour.maxGroupSize || 999;
          const newPax = Number(guests || 1);

          if (currentPax + newPax > groupLimit) {
            return res.status(400).json({
              success: false,
              error: `Rất tiếc, ngày này chỉ còn ${Math.max(0, groupLimit - currentPax)} chỗ trống (Bạn đặt ${newPax}).`
            });
          }
          // ------------------------------------------

          // --- SECURITY FIX: Enforce Server-Side Pricing ---
          const officialPrice = tour.price || 0;
          const finalTotalPrice = officialPrice * newPax;

          // Overwrite trusted values
          newBookingData.totalPrice = finalTotalPrice;
          newBookingData.serviceInfo.price = officialPrice;

        }
      } catch (e) { console.warn('Tour verification/availability check failed', e); }

      newBookingData = {
        ...newBookingData,
        type: 'tour',
        tour: tourId,
        checkInDate: new Date(checkin || Date.now()), // Tour date
        serviceInfo: {
          title: tourTitle,
          image: tourImage,
          destination: tourDestination,
          // Use values already set securely above, or fallback if tour not found (should handle error ideally)
          price: newBookingData.serviceInfo?.price || Number(body.unitPrice || 0),
          duration: body.duration || '1 ngày'
        }
      };
    }

    // ----- INVENTORY UPDATE LOGIC -----
    // FIXED: Do not decrement quantity permanently. Availability is now checked dynamically.
    /*
    // Decrement quantity for Transport services
    if (['flight', 'train', 'bus'].includes(body.type) && newBookingData.partnerService) {
       // ... logic removed ...
    }
    // Decrement quantity for Hotel services
    else if (body.type === 'hotel' && newBookingData.partnerService) {
       // ... logic removed ...
    }
    */
    // Decrement quantity for Tour services
    // Decrement quantity for Tour services
    // FIXED: Do not decrement maxGroupSize permanently. Availability is now checked by date.
    /*
    else if (body.type === 'tour' && tourId) {
      try {
        const { default: Tour } = await import('./models/Tour.js');
        const tour = await Tour.findById(tourId);
        if (tour) {
          const quantityToDeduct = guests;
          const oldQty = tour.maxGroupSize || 0;
          tour.maxGroupSize = Math.max(0, oldQty - quantityToDeduct);
    
          await tour.save();
          console.log(`[Inventory] Decremented ${quantityToDeduct} spots for Tour ${tour.title} (maxGroupSize: ${oldQty} -> ${tour.maxGroupSize})`);
        }
      } catch (err) {
        console.error('[Inventory] Failed to update tour quantity:', err);
      }
    }
    */

    const newBooking = new Booking(newBookingData);
    console.log('DEBUG: Saving Booking with Data:', {
      partnerService: newBooking.partnerService,
      serviceInfoTitle: newBooking.serviceInfo?.title,
      serviceInfoImage: newBooking.serviceInfo?.image
    });
    await newBooking.save();

    // Create Notification
    try {
      await Notification.create({
        recipient: userId,
        title: 'Đặt dịch vụ thành công',
        message: `Bạn đã đặt thành công dịch vụ: ${newBooking.serviceInfo?.title || 'Chuyến đi'}.`,
        type: 'booking',
        link: `/profile/bookings/${newBooking._id}`,
        data: { bookingId: newBooking._id },
        isRead: false
      });
    } catch (notifErr) {
      console.error('Notification create failed', notifErr);
    }

    // If Hotel, generate detailed response with provider URL
    if (hotelId) {
      const normalizedProvider = normalizeProviderUrlServer(newBookingData.serviceInfo.providerUrl, newBookingData.serviceInfo.title);
      return res.json({ success: true, id: newBooking._id, provider_url: normalizedProvider, booking: newBooking });
    }

    // Default Success
    return res.json({ success: true, id: newBooking._id, booking: newBooking });

  } catch (err) {
    console.error('Error in POST /api/bookings:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`✅ API server listening on http://localhost:${PORT}`);
});
