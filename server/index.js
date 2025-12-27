import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// If your Node < 18 and don't have global fetch, uncomment the next line:
// import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

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
import destinationRouter from './routes/destinations.js';
import tourRouter from './routes/tours.js';
import hotelRouter from './routes/hotels.js';
import flightRouter from './routes/flights.js';
import transportRouter from './routes/transport.js';
import bookingRouter from './routes/bookings.js';
import userRouter from './routes/users.js';
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

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/partner', partnerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/auth', authRouter);
app.use('/api/community', communityRouter);

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
app.use('/api/home', homeRouter);
app.use('/api/destinations', destinationRouter);
app.use('/api/tours', tourRouter);
app.use('/api/hotels', hotelRouter);
app.use('/api/flights', flightRouter);
app.use('/api/transport', transportRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/users', userRouter);

// Serve static frontend files (must be AFTER API routes)
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Handle SPA routing - return index.html for all non-API routes
// Handle SPA routing - return index.html for all non-API routes
// Note: Express 5 requires named parameters for wildcards or regex.
app.get(/.*/, (req, res) => {
  // If request route is an API call that wasn't handled, don't serve HTML
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Check if index.html exists before trying to send it
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If dist/index.html doesn't exist (e.g. in dev mode without build), give a clear message
    res.send('API Server is running. Frontend build not found in /dist. (Did you run npm run build?)');
  }
});

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
















// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`✅ API server listening on http://localhost:${PORT}`);
});


