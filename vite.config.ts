// vite.config.ts (The Final, Correct, and Refactored Version)

import { defineConfig, loadEnv, type ViteDevServer } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import mongoose from 'mongoose';
import { handleCreateBooking } from './src/lib/api/bookingHandler';
import { verifyJwt } from './src/lib/auth/jwt';

// Import Mongoose models and the DB connection utility
import Destination from './src/models/Destination';
import Tour from './src/models/Tour';
import User from './src/models/User';
import Booking from './src/models/Booking';
import Story from './src/models/Story';
import Review from './src/models/Review';
import Badge from './src/models/Badge';
import UserBadge from './src/models/UserBadge';
import dbConnect from './src/lib/dbConnect';
import { shareApiPlugin } from './src/plugins/shareApiPlugin';
import { notificationApiPlugin } from './src/plugins/notificationApiPlugin';


// --- Data Definitions (Kept separate for clarity) ---
const haLongBayData = {
  name: 'Vịnh Hạ Long',
  slug: 'ha-long-bay',
  description: 'Vịnh Hạ Long - một trong bảy kỳ quan thiên nhiên mới của thế giới...',
  history: '...',
  culture: '...',
  geography: '...',
  mainImage: 'https://images.unsplash.com/photo-1590237739814-a089f6483656',
  imageGallery: ['...'],
  bestTimeToVisit: '...',
  essentialTips: ['...'],
  status: 'published'
};
const toursForHaLong = [{ title: 'Du thuyền 2 ngày 1 đêm...', price: 2500000, duration: '2 ngày 1 đêm', maxGroupSize: 20, description: '...', itinerary: [], inclusions: [], exclusions: [], isSustainable: true }, { title: 'Tour trong ngày...', price: 850000, duration: '1 ngày', maxGroupSize: 40, description: '...', itinerary: [], inclusions: [], exclusions: [] }];

/**
 * A self-contained function to handle the entire database seeding process.
 * This improves readability and separates concerns.
 */
async function seedDatabase() {
  console.log('[SEEDER] Connecting to database...');
  await dbConnect();

  console.log('[SEEDER] Cleaning old data to ensure idempotency...');
  const oldDestination = await Destination.findOne({ slug: 'ha-long-bay' });
  if (oldDestination) {
    await Tour.deleteMany({ destination: oldDestination._id });
    await Destination.deleteOne({ _id: oldDestination._id });
  }

  console.log('[SEEDER] Creating new data...');
  const createdDestination = await Destination.create({
    ...haLongBayData,
    status: 'published' // Set status to published so it's searchable
  });
  // Ensure there is an owner (prefer a partner, fallback to admin)
  let ownerUser = await User.findOne({ role: 'partner' });
  if (!ownerUser) {
    ownerUser = await User.findOne({ role: 'admin' });
    if (!ownerUser) {
      ownerUser = await User.create({ name: 'Seed Admin', email: 'seed-admin@example.com', password: 'Password123!', role: 'admin' });
    }
  }
  const toursWithDestinationId = toursForHaLong.map(tour => ({ ...tour, destination: createdDestination._id, owner: ownerUser!._id }));
  await Tour.insertMany(toursWithDestinationId);
  console.log('[SEEDER] Seeding complete!');

  // Verification logs
  const sampleTours = await Tour.find().limit(5).lean();
  const sampleDestinations = await Destination.find().limit(5).lean();
  console.log('--- DATABASE VERIFICATION (Vite Seeder) ---');
  console.log('Sample Tours from DB:', JSON.stringify(sampleTours, null, 2));
  console.log('Sample Destinations from DB:', JSON.stringify(sampleDestinations, null, 2));
}

/**
 * Vite dev-server middleware for GET /api/users/profile
 * Uses existing JWT cookie (auth_token) and Mongo models to aggregate profile data.
 */
function profileApiPlugin() {
  return {
    name: 'vite-plugin-profile-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.originalUrl || req.url || '';

        // --- PROXY CONFIGURATION FOR PARTNER API ---
        // Forward /api/partner requests to the backend server (port 4000)
        // This is necessary because Vite's built-in proxy in server.proxy doesn't always 
        // play nicely with custom middleware if not configured carefully.
        // However, a simpler approach is to use the 'proxy' option in defineConfig.
        // But since we are here in a middleware, we can also forward if we want, 
        // OR we can rely on vite.config.ts server.proxy.
        // Let's rely on server.proxy which I will add/verify below in the config object.

        if (!url.startsWith('/api/users/profile')) return next();

        // Handle GET /api/users/profile (existing)
        if (req.method === 'GET' && url === '/api/users/profile') {

          try {
            const { parse } = await import('cookie');
            const cookies = parse(req.headers.cookie || '');
            const token = cookies['auth_token'];
            const payload = token ? verifyJwt(token) : null;
            if (!payload || !payload.userId) { res.statusCode = 401; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Authentication required.' })); }

            // --- START OF CRITICAL REFACTOR ---
            const userId = payload.userId;
            await dbConnect();
            console.log(`[Profile API] Fetching profile data for user: ${userId}`);

            // 1. Perform parallel database queries to get all raw data sets
            const [
              user,
              allBadgesFromDB,
              userBadgesFromDB, // This contains the populated badge details
              journeys,
              stories,
            ] = await Promise.all([
              User.findById(userId).lean(),
              Badge.find({}).lean(),
              UserBadge.find({ user: userId }).populate('badge').lean(),
              Booking.find({ user: userId })
                .sort({ bookingDate: -1 })
                .populate({
                  path: 'tour',
                  select: 'title mainImage slug destination',
                  populate: {
                    path: 'destination',
                    select: 'name'
                  }
                })
                .lean(),
              Story.find({ author: userId }).sort({ createdAt: -1 }).lean(),
            ]);

            if (!user) {
              res.statusCode = 404; res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'User not found.' }));
              return;
            }

            // 2. Establish a Single Source of Truth for Earned Badges
            const earnedBadges = (userBadgesFromDB || []).map((ub: any) => ub.badge).filter(Boolean);
            const earnedBadgeIds = new Set((earnedBadges || []).map((b: any) => String(b._id)));

            // 3. Derive ALL gamification stats from this single source of truth
            const earnedBadgesCount = earnedBadgeIds.size;
            const totalBadgesCount = (allBadgesFromDB || []).length;
            const completionPercentage = totalBadgesCount > 0 ? Math.round((earnedBadgesCount / totalBadgesCount) * 100) : 0;

            // Business logic for user level, now using the correct count
            let level = 'Tân binh';
            if (earnedBadgesCount >= 1) level = 'Nhà thám hiểm';
            if (earnedBadgesCount >= 5) level = 'Lữ khách dày dạn';

            // 4. Assemble the final list of all badges with their correct earned status
            const allBadgesWithStatus = (allBadgesFromDB || []).map((badge: any) => {
              const isEarned = earnedBadgeIds.has(String(badge._id));
              const userBadgeRecord = isEarned ? (userBadgesFromDB || []).find((ub: any) => String(ub.badge?._id || ub.badge) === String(badge._id)) : null;
              return {
                ...badge,
                isEarned,
                earnedAt: userBadgeRecord ? userBadgeRecord.earnedAt : null,
              };
            });
            // 4b. Group badges by category for a ready-to-render UI section
            const categorizedMap = new Map<string, { category: string; badges: any[] }>();
            for (const b of allBadgesWithStatus) {
              const cat = b.category || 'Khác';
              if (!categorizedMap.has(cat)) categorizedMap.set(cat, { category: cat, badges: [] });
              categorizedMap.get(cat)!.badges.push(b);
            }
            const categorizedBadges = Array.from(categorizedMap.values()).map((entry) => {
              const earnedCount = entry.badges.filter((x: any) => !!x.isEarned).length;
              const totalCount = entry.badges.length;
              return { category: entry.category, earnedCount, totalCount, badges: entry.badges };
            });
            // --- END OF CRITICAL REFACTOR ---

            // 5. Construct the final payload with the new, consistent data
            const responsePayload = {
              profile: {
                name: user.name,
                avatarInitials: (user.name || '').split(' ').map((n: string) => n[0]).filter(Boolean).join('').toUpperCase(),
                memberSince: user.createdAt,
                level: level,
              },
              gamification: {
                earnedBadgesCount,
                totalBadgesCount,
                completionPercentage,
                allBadges: allBadgesWithStatus,
                categorizedBadges,
              },
              journeys: (journeys || []).map((j: any) => ({
                _id: String(j._id),
                status: j.status,
                bookingDate: j.bookingDate,
                participants: j.participants,
                totalPrice: j.totalPrice,
                tour: j.tour
                  ? {
                    _id: String(j.tour._id),
                    title: j.tour.title,
                    mainImage: j.tour.mainImage || null,
                    slug: j.tour.slug,
                    destination: j.tour.destination
                      ? {
                        _id: String(j.tour.destination._id),
                        name: j.tour.destination.name,
                      }
                      : null,
                  }
                  : null,
              })),
              stories: (stories || []).map((s: any) => ({
                _id: String(s._id),
                title: s.title,
                createdAt: s.createdAt,
                coverImage: s.coverImage,
                excerpt: (s.content || '').replace(/\s+/g, ' ').trim().slice(0, 140) + ((s.content || '').length > 140 ? '…' : ''),
                likeCount: s.likeCount || (Array.isArray(s.likes) ? s.likes.length : 0),
              })),
            };

            console.log(`[Profile API] Successfully assembled consistent profile data for user: ${userId}`);
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: responsePayload }));
          } catch (err: any) {
            console.error('[VITE /api/users/profile] Error:', err);
            res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message || 'Server Error' }));
          }
        }

        // Handle PUT /api/users/profile/details - Update basic user info
        if (req.method === 'PUT' && url === '/api/users/profile/details') {
          try {
            const { parse } = await import('cookie');
            const cookies = parse(req.headers.cookie || '');
            const token = cookies['auth_token'];
            const payload = token ? verifyJwt(token) : null;
            if (!payload || !payload.userId) {
              res.statusCode = 401; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Authentication required.' }));
            }

            await dbConnect();
            const { default: User } = await import('./src/models/User');
            const body = await new Promise<any>((resolve, reject) => {
              let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject);
            });

            const { name, avatar } = body || {};
            if (!name || typeof name !== 'string' || name.trim().length < 2) {
              res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Tên phải có ít nhất 2 ký tự' }));
            }

            const user = await User.findByIdAndUpdate(payload.userId, { name: name.trim(), avatar }, { new: true }).lean();
            if (!user) {
              res.statusCode = 404; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Không tìm thấy người dùng' }));
            }

            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: { name: user.name, avatar: user.avatar } }));
          } catch (err: any) {
            console.error('[User Settings API] Error:', err);
            res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message || 'Server Error' }));
          }
        }

        // Handle PUT /api/users/profile/password - Change password
        if (req.method === 'PUT' && url === '/api/users/profile/password') {
          try {
            const { parse } = await import('cookie');
            const cookies = parse(req.headers.cookie || '');
            const token = cookies['auth_token'];
            const payload = token ? verifyJwt(token) : null;
            if (!payload || !payload.userId) {
              res.statusCode = 401; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Authentication required.' }));
            }

            await dbConnect();
            const { default: User } = await import('./src/models/User');
            const body = await new Promise<any>((resolve, reject) => {
              let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject);
            });

            const { currentPassword, newPassword } = body || {};
            if (!currentPassword || !newPassword) {
              res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' }));
            }

            if (newPassword.length < 6) {
              res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }));
            }

            const user = await User.findById(payload.userId).select('+password');
            if (!user) {
              res.statusCode = 404; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Không tìm thấy người dùng' }));
            }

            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
              res.statusCode = 401; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Mật khẩu hiện tại không đúng' }));
            }

            user.password = newPassword;
            await user.save();

            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, message: 'Mật khẩu đã được thay đổi thành công' }));
          } catch (err: any) {
            console.error('[User Settings API] Error:', err);
            res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message || 'Server Error' }));
          }
        }

        // Handle PUT /api/users/profile/notifications - Update notification preferences
        if (req.method === 'PUT' && url === '/api/users/profile/notifications') {
          try {
            const { parse } = await import('cookie');
            const cookies = parse(req.headers.cookie || '');
            const token = cookies['auth_token'];
            const payload = token ? verifyJwt(token) : null;
            if (!payload || !payload.userId) {
              res.statusCode = 401; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Authentication required.' }));
            }

            await dbConnect();
            const { default: User } = await import('./src/models/User');
            const body = await new Promise<any>((resolve, reject) => {
              let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject);
            });

            const { marketingEmails } = body || {};
            if (typeof marketingEmails !== 'boolean') {
              res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Giá trị không hợp lệ' }));
            }

            const user = await User.findByIdAndUpdate(payload.userId, { 'preferences.marketingEmails': marketingEmails }, { new: true }).lean();
            if (!user) {
              res.statusCode = 404; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Không tìm thấy người dùng' }));
            }

            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: { marketingEmails } }));
          } catch (err: any) {
            console.error('[User Settings API] Error:', err);
            res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message || 'Server Error' }));
          }
        }

        // Handle DELETE /api/users/profile - Delete user account with password re-authentication
        if (req.method === 'DELETE' && url === '/api/users/profile') {
          try {
            const { parse } = await import('cookie');
            const cookies = parse(req.headers.cookie || '');
            const token = cookies['auth_token'];
            const payload = token ? verifyJwt(token) : null;
            if (!payload || !payload.userId) {
              res.statusCode = 401; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Authentication required.' }));
            }

            await dbConnect();
            const { default: User } = await import('./src/models/User');
            const { default: Story } = await import('./src/models/Story');
            const { default: Review } = await import('./src/models/Review');

            const body = await new Promise<any>((resolve, reject) => {
              let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject);
            });

            // Add explicit logging to see exactly what the backend receives
            console.log('[API /users/profile DELETE] Received request body:', body);
            console.log('[API /users/profile DELETE] Body type:', typeof body);
            console.log('[API /users/profile DELETE] Body keys:', Object.keys(body || {}));

            const { password } = body || {};

            // This check is now more explicit and provides better error messages
            if (!password) {
              console.log('[API /users/profile DELETE] Password validation failed: password is missing or empty');
              res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Mật khẩu là bắt buộc để xác nhận xóa tài khoản' }));
            }

            if (typeof password !== 'string') {
              console.log('[API /users/profile DELETE] Password validation failed: password is not a string, type:', typeof password);
              res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Mật khẩu phải là một chuỗi ký tự hợp lệ' }));
            }

            console.log('[API /users/profile DELETE] Password validation passed, proceeding with authentication');

            // Re-authenticate user with password
            const user = await User.findById(payload.userId).select('+password');
            if (!user) {
              res.statusCode = 404; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Không tìm thấy người dùng' }));
            }

            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
              res.statusCode = 401; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Mật khẩu không chính xác' }));
            }

            console.log(`[Account Deletion] Starting deletion process for user: ${user.email}`);

            // Data anonymization - Soft delete strategy
            // Anonymize user stories (set author to null to preserve content)
            const storiesResult = await Story.updateMany(
              { author: payload.userId },
              { $set: { author: null } }
            );
            console.log(`[Account Deletion] Anonymized ${storiesResult.modifiedCount} stories`);

            // Anonymize user reviews (set user to null to preserve content)
            const reviewsResult = await Review.updateMany(
              { user: payload.userId },
              { $set: { user: null } }
            );
            console.log(`[Account Deletion] Anonymized ${reviewsResult.modifiedCount} reviews`);

            // Hard delete the user account
            await User.findByIdAndDelete(payload.userId);
            console.log(`[Account Deletion] Deleted user account: ${user.email}`);

            // Clear authentication cookie
            res.setHeader('Set-Cookie', 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict');

            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: true,
              message: 'Tài khoản đã được xóa thành công. Tất cả dữ liệu cá nhân đã được xóa và nội dung cộng đồng đã được ẩn danh.'
            }));
          } catch (err: any) {
            console.error('[Account Deletion API] Error:', err);
            res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message || 'Server Error' }));
          }
        }

        return next();
      });
    },
  };
}

// --- AI Chat API Plugin: POST /api/chat ---
// --- RESILIENCE CONFIGURATION FOR CHAT API ---
const PRIMARY_MODEL = 'gemini-1.5-flash-latest';
const FALLBACK_MODEL = 'gemini-1.5-pro-latest';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function chatApiPlugin(env?: Record<string, string>) {
  return {
    name: 'vite-plugin-chat-api',
    configureServer(server: ViteDevServer) {
      // Stream proxy: POST /api/chat/stream -> AI service /v1/agent/chat/stream
      server.middlewares.use('/api/chat/stream', async (req: any, res: any, next: any) => {
        const url = req.originalUrl || req.url || '';
        if (!(req.method === 'POST' && url === '/api/chat/stream')) return next();
        try {
          // Read raw body
          let body = '';
          await new Promise<void>((resolve) => {
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => resolve());
          });
          let parsed: any = {};
          try { parsed = JSON.parse(body || '{}'); } catch { parsed = {}; }
          const { message, user_id, context } = parsed || {};
          if (!message || !String(message).trim()) {
            res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: 'Missing message in request body' }));
          }

          const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8081';
          const controller = new AbortController();
          const timeoutMs = Number(process.env.AI_CHAT_TIMEOUT_MS || 30000);
          const timeout = setTimeout(() => controller.abort(), timeoutMs);
          let aiResp: Response | null = null;
          try {
            aiResp = await fetch(`${aiUrl}/v1/agent/chat/stream`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message, user_id, context }),
              signal: controller.signal,
            });
          } catch (err) {
            clearTimeout(timeout);
            res.statusCode = 502; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: 'Không thể kết nối AI service. Vui lòng thử lại sau.' }));
          }
          clearTimeout(timeout);
          if (!aiResp || !aiResp.ok || !aiResp.body) {
            res.statusCode = aiResp?.status || 502; res.setHeader('Content-Type', 'application/json');
            const txt = aiResp ? await aiResp.text() : '';
            return res.end(JSON.stringify({ success: false, error: txt || 'AI service error' }));
          }

          // Passthrough stream
          res.statusCode = 200; res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          const reader = (aiResp.body as any).getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) res.write(Buffer.from(value));
            }
          } catch (_) {
            // ignore stream errors
          } finally {
            res.end();
          }
        } catch (e: any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: e?.message || 'Internal Server Error' }));
        }
      });
      // JSON body parser for this route
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.originalUrl || req.url || '';
        if (!(req.method === 'POST' && url === '/api/chat')) return next();
        try {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try { req.body = JSON.parse(body || '{}'); } catch { req.body = {}; }
            next();
          });
        } catch {
          req.body = {};
          next();
        }
      });

      // Route handler (strict to EXACT '/api/chat', do not intercept '/api/chat/stream')
      server.middlewares.use('/api/chat', async (req: any, res: any, next: any) => {
        const url = req.originalUrl || req.url || '';
        if (!(req.method === 'POST' && url === '/api/chat')) return next();
        try {
          // 1) Securely get API key from env
          const apiKey = (env && env.VITE_GOOGLE_API_KEY) || process.env.VITE_GOOGLE_API_KEY;
          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: 'Server misconfiguration: VITE_GOOGLE_API_KEY is missing.' }));
          }

          const { messages } = req.body || {};
          if (!Array.isArray(messages) || messages.length === 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: 'Message history is required.' }));
          }

          // 2) Initialize Gemini client & model
          const genAI = new GoogleGenerativeAI(String(apiKey));
          // 2a) Define tool/function declarations for agentic function calling
          const toolSpec = [{
            functionDeclarations: [
              {
                name: 'getWeatherForecast',
                description: 'Provides the real-time weather forecast. This tool requires a "location" and "date". If the user provides a location but not a date, ask for the date. If the user provides a date but the location is unknown from the conversation history, ask for the location. Only call this tool when you have all the necessary information.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    location: { type: 'STRING', description: "The Vietnamese city, e.g., 'Sa Pa', 'Đà Nẵng'." },
                    date: { type: 'STRING', description: "The desired date, e.g., 'tomorrow', 'next Sunday', '2025-12-25'." }
                  },
                  required: ['location', 'date']
                }
              },
              {
                name: 'searchVietravelDatabase',
                description: 'Search the Vietravel database for tours, experiences, and articles. Use this when a user asks for recommendations, suggestions for things to do, or information about a specific destination.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    query: { type: 'STRING', description: 'Free-text search query describing tours, activities, destinations, or topics.' }
                  },
                  required: ['query']
                }
              },
              {
                name: 'getUserBookings',
                description: 'Get the current user\'s booking history. Use this when the user asks about their bookings, reservations, or past trips.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    userId: { type: 'STRING', description: 'The authenticated user\'s ID from the Vietravel system.' }
                  },
                  required: ['userId']
                }
              }
            ],
          }];

          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
            tools: toolSpec,
            systemInstruction: `You are a helpful and expert travel assistant for Vietravel.
    QUY TẮC TỐI THƯỢNG:
    1) TỔNG HỢP NGỮ CẢNH: Luôn luôn đọc và hiểu TOÀN BỘ lịch sử cuộc hội thoại để thu thập đủ thông tin trước khi hành động.
    2) PHẢI SỬ DỤNG CÔNG CỤ: Nếu câu hỏi của người dùng (sau khi đã tổng hợp ngữ cảnh) khớp với mô tả của một công cụ, bạn BẮT BUỘC phải gọi công cụ đó.
    3) HỎI LẠI NẾU THIẾU: Nếu bạn cần thêm thông tin để sử dụng một công cụ, hãy hỏi lại người dùng một cách lịch sự.
    4) TRẢ LỜI BẰNG TIẾNG VIỆT.`,
          });

          // 3) Lean RAG & prompt engineering (placeholder for DB context)
          const originalUserMessage = String(messages[messages.length - 1]?.content || '').trim();
          const normalizedUserMessage = originalUserMessage.toLowerCase();
          console.log(`[AI Agent] Original query: "${originalUserMessage}", Normalized query: "${normalizedUserMessage}"`);
          await dbConnect();
          const context = '--- Context from Vietravel ---\n(Trống)';
          const systemPrompt = 'Bạn là một trợ lý du lịch AI thân thiện, hữu ích và chuyên nghiệp của Vietravel. Luôn trả lời bằng tiếng Việt, sử dụng thông tin trong phần "Context" nếu có để làm câu trả lời phù hợp với sản phẩm/dịch vụ của Vietravel.';
          const finalPromptForRAG = `${systemPrompt}\n\n${context}\n\n--- Câu hỏi của người dùng ---\n"${normalizedUserMessage}"`;

          // 4) Format conversation history for Gemini (ai -> model)
          const history = messages
            .slice(0, -1)
            .map((m: any) => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] }))
            .filter((m: any, idx: number) => !(idx === 0 && m.role === 'model'));

          // 5) Use generateContent (stateless) with explicit tools
          const historyParts = history as any[];
          const currentUserTurn = { role: 'user', parts: [{ text: finalPromptForRAG }] } as any;
          const result = await model.generateContent({ contents: [...historyParts, currentUserTurn], tools: toolSpec });
          const response = await result.response;
          // --- Diagnostic logging to observe raw model response structure ---
          try {
            const jsonLike: any = typeof (response as any).toJSON === 'function' ? (response as any).toJSON() : response;
            console.log('[GEMINI RAW RESPONSE]', JSON.stringify(jsonLike, null, 2));
          } catch (e) {
            console.log('[GEMINI RAW RESPONSE][non-serializable]', String(e));
          }

          // 6) Agentic tool-use branch
          const fns = typeof (response as any).functionCalls === 'function' ? (response as any).functionCalls() : [];
          if (Array.isArray(fns) && fns.length) {
            console.log('[AGENT] Gemini requested function call:', fns.map((c: any) => c.name).join(','));
            const call = fns[0];

            const toolsModule = await import('./src/services/aiTools');
            const toolImpl = (toolsModule as any)[call.name];
            if (typeof toolImpl !== 'function') {
              const fallbackText = 'Xin lỗi, tôi chưa có công cụ phù hợp để xử lý yêu cầu này.';
              res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, data: { response: fallbackText } }));
            }

            const toolResult = await toolImpl(call.args || {});
            console.log('[AGENT] Tool result summary:', call.name, Array.isArray(toolResult?.results) ? `${toolResult.results.length} results` : JSON.stringify(toolResult).slice(0, 200));

            // Second call: provide tool response back
            const result2 = await model.generateContent({
              contents: [...historyParts, currentUserTurn, { toolResponse: { name: call.name, response: toolResult } } as any],
              tools: toolSpec,
            });
            const finalResponse = result2.response.text();

            // Optionally construct UI cards when applicable
            let cards: any[] | undefined;
            if (call.name === 'searchVietravelDatabase' && toolResult?.results?.length) {
              cards = toolResult.results.slice(0, 8).map((r: any) => r.type === 'tour' ? ({
                type: 'tour',
                data: {
                  id: r._id,
                  title: r.title,
                  price: r.price,
                  rating: r.averageRating,
                  destinationName: r.destination?.name,
                  slug: r.slug,
                  image: r.coverImage,
                }
              }) : ({
                type: 'story',
                data: {
                  id: r._id,
                  title: r.title,
                  summary: r.summary,
                  slug: r.slug,
                  image: r.coverImage,
                }
              }));
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: { response: finalResponse, cards } }));
          }

          // 7) No function calls: direct answer
          const aiResponseText = response.text();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, data: { response: aiResponseText } }));
        } catch (error: any) {
          console.error('[VITE SERVER /api/chat] Gemini API Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: `Server Error: ${error.message || 'unknown'}` }));
        }
      });
    },
  };
}

// --- Planner API Plugin: Proxy to AI Service ---
function plannerApiPlugin(env?: Record<string, string>) {
  return {
    name: 'vite-plugin-planner-api',
    configureServer(server: ViteDevServer) {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8081';

      // Proxy /api/planner/* to AI service /v1/planner/*
      server.middlewares.use('/api/planner', async (req: any, res: any, next: any) => {
        const url = req.originalUrl || req.url || '';
        if (!url.startsWith('/api/planner')) return next();

        try {
          // Parse body for POST requests
          if (req.method === 'POST' || req.method === 'PATCH') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk.toString(); });
            await new Promise<void>((resolve) => {
              req.on('end', () => {
                try { req.body = JSON.parse(body || '{}'); } catch { req.body = {}; }
                resolve();
              });
            });
          }

          // Extract path after /api/planner
          const path = url.replace('/api/planner', '/v1/planner');
          const targetUrl = `${aiUrl}${path}`;

          // Forward request to AI service using node-fetch for better streaming support
          const nodeFetch = (await import('node-fetch')).default;
          const response = await nodeFetch(targetUrl, {
            method: req.method,
            headers: {
              'Content-Type': 'application/json',
              ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}),
            },
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body || {}) : undefined,
          });

          // Stream SSE response
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/event-stream')) {
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            // Stream the response using node-fetch's body stream
            if (response.body) {
              response.body.pipe(res);
            } else {
              res.end();
            }
          } else {
            // Regular JSON response
            const data = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(data);
          }
        } catch (error: any) {
          console.error('[VITE PROXY /api/planner] Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: error.message || 'Proxy error' }));
        }
      });
    },
  };
}

/**
 * A custom Vite plugin to create a dev-only API endpoint for seeding.
 * This is the standard way to add server middleware in Vite.
 */
function seedApiPlugin() {
  return {
    name: 'vite-plugin-seed-endpoint',
    configureServer(server: ViteDevServer) {
      // --- Public Bookings API (create booking) ---
      // server.middlewares.use(async (req: any, res: any, next: any) => {
      //   const url = req.originalUrl || req.url || '';
      //   const method = req.method;
      //   if (method === 'POST' && url.startsWith('/api/bookings')) {
      //     console.log('[API ROUTER] Handling POST /api/bookings');
      //     return handleCreateBooking(req, res);
      //   }
      //   return next();
      // });
      // --- Admin User Management APIs ---
      // --- Booking Admin APIs (admin, staff) ---
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/admin/bookings')) return next();
        const { parse } = await import('cookie');
        const { verifyJwt } = await import('./src/lib/auth/jwt.js');
        const cookies = parse(req.headers.cookie || '');
        let token = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          token = req.headers.authorization.split(' ')[1];
        } else {
          token = cookies['auth_token'];
        }
        if (!token) { res.statusCode = 401; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Unauthorized' })); }
        const payload = verifyJwt(token);
        if (!payload || !['admin', 'staff'].includes(payload.role)) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
        await dbConnect();
        const method = req.method;
        try {
          // GET list with filters, search, pagination
          if (method === 'GET' && url === '/api/admin/bookings') {
            const { default: Booking } = await import('./src/models/Booking');
            const { default: User } = await import('./src/models/User');
            const { default: Tour } = await import('./src/models/Tour');
            const u = new URL(url, 'http://localhost');
            // Note: vite's server gives only path, so fall back to req.originalUrl if present
          }
          if (method === 'GET' && url.startsWith('/api/admin/bookings')) {
            const { default: Booking } = await import('./src/models/Booking');
            const fullUrl = new URL(req.originalUrl || url, 'http://localhost');
            const page = Number(fullUrl.searchParams.get('page') || '1');
            const limit = Math.min(100, Number(fullUrl.searchParams.get('limit') || '20'));
            const q = (fullUrl.searchParams.get('q') || '').trim();
            const statusStr = fullUrl.searchParams.get('status') || '';
            const ownerId = fullUrl.searchParams.get('ownerId') || '';
            const dateFrom = fullUrl.searchParams.get('from');
            const dateTo = fullUrl.searchParams.get('to');

            // Build the $match stage DYNAMICALLY and securely
            const matchStage: any = {};

            // Only add the 'status' field to the match if a specific status is requested
            if (statusStr && typeof statusStr === 'string' && statusStr !== 'all') {
              // Add a whitelist check for extra security
              const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'];
              if (allowedStatuses.includes(statusStr)) {
                matchStage.status = statusStr;
              }
            }

            // Add date filters if provided
            if (dateFrom || dateTo) {
              matchStage.bookingDate = {};
              if (dateFrom) matchStage.bookingDate.$gte = new Date(dateFrom);
              if (dateTo) matchStage.bookingDate.$lte = new Date(dateTo);
            }

            // Add owner filter if provided (this will be handled after lookup)
            if (ownerId) {
              matchStage['tour.owner'] = new (await import('mongoose')).default.Types.ObjectId(ownerId);
            }

            console.log(`[BOOKINGS API] Match stage:`, JSON.stringify(matchStage, null, 2));
            console.log(`[BOOKINGS API] Query params: status=${statusStr}, search=${q}, ownerId=${ownerId}, page=${page}, limit=${limit}`);

            const pipeline: any[] = [
              // First stage: Apply filters to the main booking collection
              { $match: matchStage },
              { $sort: { createdAt: -1 } },
              // Lookup related data
              { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
              { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
              { $lookup: { from: 'tours', localField: 'tour', foreignField: '_id', as: 'tour' } },
              { $unwind: { path: '$tour', preserveNullAndEmptyArrays: true } },
              { $lookup: { from: 'users', localField: 'tour.owner', foreignField: '_id', as: 'owner' } },
              { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
              // Apply search filter after lookups (if search query provided)
              ...(q ? [{
                $match: {
                  $or: [
                    { _id: { $regex: q, $options: 'i' } },
                    { 'tour.title': { $regex: q, $options: 'i' } },
                    { 'user.name': { $regex: q, $options: 'i' } },
                    { 'user.email': { $regex: q, $options: 'i' } }
                  ]
                }
              }] : []),
              // Pagination
              { $skip: (page - 1) * limit },
              { $limit: limit }
            ];

            const [rows, totalArr] = await Promise.all([
              (await import('mongoose')).default.connection.collection('bookings').aggregate(pipeline).toArray(),
              // Count total documents with the same filters (excluding search and pagination)
              (await import('mongoose')).default.connection.collection('bookings').countDocuments(matchStage),
            ]);
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: rows, total: totalArr }));
          }
          // GET single booking by id with deep populate
          const singleMatch = url.match(/^\/api\/admin\/bookings\/([^/]+)$/);
          if (method === 'GET' && singleMatch) {
            const { default: Booking } = await import('./src/models/Booking');
            const id = singleMatch[1];
            const doc = await Booking.findById(id)
              .populate('user', 'name email avatar')
              .populate({ path: 'tour', select: 'title owner mainImage', populate: { path: 'owner', select: 'name email' } })
              .lean();
            if (!doc) { res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Not found' })); }
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: doc }));
          }
          // PUT status update + history
          const statusMatch = url.match(/^\/api\/admin\/bookings\/([^/]+)\/status$/);
          if (method === 'PUT' && statusMatch) {
            const { default: Booking } = await import('./src/models/Booking');
            const id = statusMatch[1];
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { status, note } = body || {};
            if (!['pending', 'confirmed', 'cancelled', 'refunded', 'completed'].includes(status)) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Invalid status' })); }
            const update: any = { status };
            const historyEntry = { at: new Date(), action: `Status updated to '${status}'`, by: payload.userId ? (await import('mongoose')).default.Types.ObjectId.createFromHexString(payload.userId) : undefined, note } as any;
            const doc = await (await import('./src/models/Booking')).default.findByIdAndUpdate(id, { $set: update, $push: { history: historyEntry } }, { new: true });
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: doc }));
          }
          // POST resend confirmation (stub)
          const resendMatch = url.match(/^\/api\/admin\/bookings\/([^/]+)\/resend-confirmation$/);
          if (method === 'POST' && resendMatch) {
            const id = resendMatch[1];
            // Simulate async email sending
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, message: 'Resent confirmation email', id }));
          }
          return next();
        } catch (err: any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });
      // --- Marketing Admin APIs (admin only for create/update/delete, admin/staff for read) ---
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/admin/coupons') && !url.startsWith('/api/admin/banners') && !url.startsWith('/api/admin/collections') && !url.startsWith('/api/bookings/apply-coupon')) return next();
        const { parse } = await import('cookie');
        const { verifyJwt } = await import('./src/lib/auth/jwt.js');
        const cookies = parse(req.headers.cookie || '');
        let token = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          token = req.headers.authorization.split(' ')[1];
        } else {
          token = cookies['auth_token'];
        }
        const payload = token ? verifyJwt(token) : null;
        const isAdmin = !!payload && payload.role === 'admin';
        const isStaff = !!payload && ['admin', 'staff'].includes(payload.role);
        await dbConnect();
        const method = req.method;
        try {
          // COUPONS CRUD
          if (url === '/api/admin/coupons' && method === 'GET') {
            const { default: Coupon } = await import('./src/models/Coupon');
            const rows = await Coupon.find({}).sort({ createdAt: -1 }).lean();
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url === '/api/admin/coupons' && method === 'POST') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const { default: Coupon } = await import('./src/models/Coupon');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const created = await Coupon.create(body);
            res.statusCode = 201; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: created }));
          }
          const couponMatch = url.match(/^\/api\/admin\/coupons\/([^/]+)$/);
          if (couponMatch && method === 'PUT') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const id = couponMatch[1];
            const { default: Coupon } = await import('./src/models/Coupon');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const updated = await Coupon.findByIdAndUpdate(id, body, { new: true });
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: updated }));
          }
          if (couponMatch && method === 'DELETE') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const id = couponMatch[1];
            const { default: Coupon } = await import('./src/models/Coupon');
            await Coupon.findByIdAndDelete(id);
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true }));
          }

          // BANNERS CRUD + reorder
          if (url === '/api/admin/banners' && method === 'GET') {
            const { default: Banner } = await import('./src/models/Banner');
            const rows = await Banner.find({}).sort({ displayOrder: 1 }).lean();
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url === '/api/admin/banners' && method === 'POST') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const { default: Banner } = await import('./src/models/Banner');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });

            // Calculate displayOrder for new banner
            const highestOrderBanner = await Banner.findOne({}).sort({ displayOrder: -1 }).lean();
            const newDisplayOrder = (highestOrderBanner?.displayOrder || 0) + 1;

            // Create banner with calculated displayOrder
            const bannerData = { ...body, displayOrder: newDisplayOrder };
            const created = await Banner.create(bannerData);
            res.statusCode = 201; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: created }));
          }
          const bannerMatch = url.match(/^\/api\/admin\/banners\/([^/]+)$/);
          if (bannerMatch && method === 'PUT') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const { default: Banner } = await import('./src/models/Banner');
            const id = bannerMatch[1];
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const updated = await Banner.findByIdAndUpdate(id, body, { new: true });
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: updated }));
          }
          if (bannerMatch && method === 'DELETE') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const { default: Banner } = await import('./src/models/Banner');
            const id = bannerMatch[1];
            await Banner.findByIdAndDelete(id);
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true }));
          }

          // reorder endpoint
          if (url === '/api/admin/banners/reorder' && method === 'PUT') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const { default: Banner } = await import('./src/models/Banner');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { order } = body || { order: [] };
            // order is array of { id, displayOrder }
            for (const it of order || []) {
              await Banner.findByIdAndUpdate(it.id, { displayOrder: it.displayOrder });
            }
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true }));
          }

          // COLLECTIONS CRUD
          if (url === '/api/admin/collections' && method === 'GET') {
            const { default: Collection } = await import('./src/models/Collection');
            const rows = await Collection.find({}).populate('tours', 'title mainImage').sort({ createdAt: -1 }).lean();
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url === '/api/admin/collections' && method === 'POST') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const { default: Collection } = await import('./src/models/Collection');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const created = await Collection.create(body);
            res.statusCode = 201; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: created }));
          }
          const collectionMatch = url.match(/^\/api\/admin\/collections\/([^/]+)$/);
          if (collectionMatch && method === 'PUT') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const { default: Collection } = await import('./src/models/Collection');
            const id = collectionMatch[1];
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const updated = await Collection.findByIdAndUpdate(id, body, { new: true });
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: updated }));
          }
          if (collectionMatch && method === 'DELETE') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const { default: Collection } = await import('./src/models/Collection');
            const id = collectionMatch[1];
            await Collection.findByIdAndDelete(id);
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true }));
          }

          // REFERRAL PROGRAM SETTINGS endpoints
          if (url === '/api/admin/settings/referral' && method === 'GET') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const { default: Settings } = await import('./src/models/Settings');
            let settings = await Settings.findOne({}).lean();
            if (!settings) {
              // Create default settings if none exist
              settings = await Settings.create({});
            }
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: settings.referralProgram }));
          }
          if (url === '/api/admin/settings/referral' && method === 'PUT') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const { default: Settings } = await import('./src/models/Settings');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });

            // Validate the incoming data
            const { rewardAmount, discountPercentage } = body;
            if (typeof rewardAmount !== 'number' || rewardAmount < 0) {
              res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Invalid reward amount' }));
            }
            if (typeof discountPercentage !== 'number' || discountPercentage < 0 || discountPercentage > 100) {
              res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Invalid discount percentage' }));
            }

            const updated = await Settings.findOneAndUpdate(
              {},
              { referralProgram: { rewardAmount, discountPercentage } },
              { upsert: true, new: true }
            );
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: updated.referralProgram }));
          }

          // PUBLIC APPLY-COUPON endpoint
          if (url === '/api/bookings/apply-coupon' && method === 'POST') {
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { bookingId, couponCode } = body || {};
            const { default: Coupon } = await import('./src/models/Coupon');
            const { default: Booking } = await import('./src/models/Booking');
            const { default: Tour } = await import('./src/models/Tour');
            if (!bookingId || !couponCode) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'bookingId and couponCode are required' })); }
            const booking = await Booking.findById(bookingId).populate('user', '_id').populate('tour', 'owner destination').lean();
            if (!booking) { res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Booking not found' })); }
            const coupon = await Coupon.findOne({ code: couponCode }).lean();
            if (!coupon || !coupon.isActive) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Invalid coupon' })); }
            const now = new Date();
            if (coupon.startDate && now < coupon.startDate) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Coupon not started' })); }
            if (coupon.endDate && now > coupon.endDate) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Coupon expired' })); }
            if (coupon.limits?.totalUses && coupon.usedCount >= coupon.limits.totalUses) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Coupon usage limit reached' })); }
            if (coupon.limits?.usesPerCustomer && (coupon.usedBy || []).some((u: any) => String(u) === String(booking.user._id))) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Coupon already used by this customer' })); }
            if (coupon.rules?.minimumSpend && booking.totalPrice < coupon.rules.minimumSpend) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Minimum spend not met' })); }
            if (coupon.rules?.applicableToTours?.length && !coupon.rules.applicableToTours.some((id: any) => String(id) === String(booking.tour))) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Coupon not applicable to this tour' })); }
            if (coupon.rules?.applicableToDestinations?.length && !coupon.rules.applicableToDestinations.some((id: any) => String(id) === String((booking.tour as any).destination))) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Coupon not applicable to this destination' })); }
            if (coupon.rules?.applicableToPartners?.length && !coupon.rules.applicableToPartners.some((id: any) => String(id) === String((booking.tour as any).owner))) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Coupon not applicable to this partner' })); }
            // calculate discount
            let discount = 0;
            if (coupon.discountType === 'percentage') discount = (booking.totalPrice || 0) * (coupon.discountValue / 100);
            else discount = coupon.discountValue;
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: { discount, newTotal: Math.max(0, (booking.totalPrice || 0) - discount) } }));
          }
          return next();
        } catch (err: any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });
      // --- Analytics Admin APIs (admin, staff) ---
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/admin/analytics')) return next();
        const { parse } = await import('cookie');
        const { verifyJwt } = await import('./src/lib/auth/jwt.js');
        const cookies = parse(req.headers.cookie || '');
        let token = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          token = req.headers.authorization.split(' ')[1];
        } else {
          token = cookies['auth_token'];
        }
        const payload = token ? verifyJwt(token) : null;
        if (!payload || !['admin', 'staff'].includes(payload.role)) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
        await dbConnect();
        const u = new URL(req.originalUrl || url, 'http://localhost');
        const startDate = u.searchParams.get('startDate') ? new Date(String(u.searchParams.get('startDate'))) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const endDate = u.searchParams.get('endDate') ? new Date(String(u.searchParams.get('endDate'))) : new Date();
        try {
          if (url.startsWith('/api/admin/analytics/overview')) {
            const { default: Booking } = await import('./src/models/Booking');
            const { default: User } = await import('./src/models/User');
            const { default: Tour } = await import('./src/models/Tour');
            const revAgg = await Booking.aggregate([
              { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $in: ['confirmed', 'refunded', 'cancelled', 'pending'] } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ]);
            const kpis = await Promise.all([
              Booking.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $in: ['confirmed', 'refunded', 'cancelled', 'pending'] } } }, { $group: { _id: null, revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } }]),
              User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
              Tour.aggregate([{ $group: { _id: null, avgRating: { $avg: '$averageRating' } } }])
            ]);
            const topTours = await Booking.aggregate([
              { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
              { $group: { _id: '$tour', revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
              { $sort: { revenue: -1 } },
              { $limit: 5 },
              { $lookup: { from: 'tours', localField: '_id', foreignField: '_id', as: 'tour' } },
              { $unwind: '$tour' }
            ]);
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: { revAgg, kpis, topTours } }));
          }
          if (url.startsWith('/api/admin/analytics/revenue')) {
            const { default: Booking } = await import('./src/models/Booking');
            const destinationId = u.searchParams.get('destinationId');
            const partnerId = u.searchParams.get('partnerId');
            const pipeline: any[] = [{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }];
            if (destinationId) pipeline.push({ $lookup: { from: 'tours', localField: 'tour', foreignField: '_id', as: 'tour' } }, { $unwind: '$tour' }, { $match: { 'tour.destination': (await import('mongoose')).default.Types.ObjectId.createFromHexString(destinationId) } });
            if (partnerId) pipeline.push({ $lookup: { from: 'tours', localField: 'tour', foreignField: '_id', as: 'tour' } }, { $unwind: '$tour' }, { $match: { 'tour.owner': (await import('mongoose')).default.Types.ObjectId.createFromHexString(partnerId) } });
            pipeline.push({ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, totalRevenue: { $sum: '$totalPrice' }, bookingFees: { $sum: { $multiply: ['$totalPrice', 0.05] } }, refunds: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$totalPrice', 0] } } } }, { $sort: { _id: 1 } });
            const rows = await Booking.aggregate(pipeline);
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url.startsWith('/api/admin/analytics/product-performance')) {
            const { default: Tour } = await import('./src/models/Tour');
            const { default: Booking } = await import('./src/models/Booking');
            // Mock pageViews from tours (extend in future)
            const tours = await Tour.find({}).select('title averageRating owner').lean();
            const byTour = await Booking.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }, { $group: { _id: '$tour', bookings: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } }]);
            const map: Record<string, any> = {}; byTour.forEach((b: any) => map[String(b._id)] = b);
            const rows = tours.map((t: any) => ({ tourId: String(t._id), name: t.title, pageViews: Math.floor(Math.random() * 5000) + 500, bookings: map[String(t._id)]?.bookings || 0, conversionRate: ((map[String(t._id)]?.bookings || 0) / Math.max(1, Math.floor(Math.random() * 5000) + 500)) * 100, avgRating: t.averageRating || 0, totalRevenue: map[String(t._id)]?.revenue || 0 }));
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url.startsWith('/api/admin/analytics/customer-segments')) {
            const { default: Booking } = await import('./src/models/Booking');
            const { default: User } = await import('./src/models/User');
            const segment = u.searchParams.get('segment') || 'vip';
            if (segment === 'vip') {
              const agg = await Booking.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }, { $group: { _id: '$user', totalSpend: { $sum: '$totalPrice' } } }, { $sort: { totalSpend: -1 } }, { $limit: 100 }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } }, { $unwind: '$user' }]);
              res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: agg }));
            }
            if (segment === 'new') {
              const agg = await User.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }, { $project: { name: 1, email: 1, createdAt: 1 } }]);
              res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: agg }));
            }
            if (segment === 'at_risk') {
              const cutoff = new Date(endDate); cutoff.setMonth(cutoff.getMonth() - 6);
              const active = await Booking.distinct('user', { createdAt: { $gte: cutoff, $lte: endDate } });
              const agg = await User.find({ _id: { $nin: active } }).select('name email createdAt').lean();
              res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: agg }));
            }
          }
          if (url.startsWith('/api/admin/analytics/coupon-performance')) {
            const { default: Booking } = await import('./src/models/Booking');
            const { default: Coupon } = await import('./src/models/Coupon');
            // Assuming future link between bookings and coupon applied; for now mock aggregated view using coupon usage
            const rows = await Coupon.find({}).select('code usedCount').lean();
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: rows }));
          }
          return next();
        } catch (err: any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });

      // --- Dashboard Admin APIs (admin, staff) ---
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/admin/dashboard')) return next();

        const { parse } = await import('cookie');
        const { verifyJwt } = await import('./src/lib/auth/jwt.js');
        const cookies = parse(req.headers.cookie || '');
        let token = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          token = req.headers.authorization.split(' ')[1];
        } else {
          token = cookies['auth_token'];
        }
        const payload = token ? verifyJwt(token) : null;

        if (!payload || !['admin', 'staff'].includes(payload.role)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: 'Forbidden' }));
        }

        await dbConnect();

        // Parse query parameters for date range
        const u = new URL(req.originalUrl || url, 'http://localhost');
        const from = u.searchParams.get('from');
        const to = u.searchParams.get('to');

        // Default to current month if no dates provided
        const now = new Date();
        const startDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Previous period for comparison (same duration)
        const durationMs = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - durationMs);
        const prevEndDate = new Date(startDate.getTime() - 1);

        try {
          // Main aggregation pipeline using $facet for parallel processing
          const { default: Booking } = await import('./src/models/Booking');
          const { default: User } = await import('./src/models/User');
          const { default: Review } = await import('./src/models/Review');
          const { default: Tour } = await import('./src/models/Tour');

          const mainAggregation = await Booking.aggregate([
            {
              $match: {
                createdAt: { $gte: startDate, $lte: endDate }
              }
            },
            {
              $facet: {
                // KPI Metrics - all calculations in parallel
                kpiMetrics: [
                  {
                    $group: {
                      _id: null,
                      totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, '$totalPrice', 0] } },
                      totalBookings: { $sum: 1 },
                      confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
                      pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                      cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                      refundedBookings: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
                      avgBookingValue: { $avg: '$totalPrice' }
                    }
                  }
                ],
                // Revenue over time for charts
                revenueOverTime: [
                  {
                    $match: { status: 'confirmed' }
                  },
                  {
                    $group: {
                      _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                      },
                      revenue: { $sum: '$totalPrice' },
                      bookings: { $sum: 1 }
                    }
                  },
                  {
                    $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
                  },
                  {
                    $project: {
                      _id: 0,
                      date: {
                        $dateToString: {
                          format: '%Y-%m-%d',
                          date: {
                            $dateFromParts: {
                              year: '$_id.year',
                              month: '$_id.month',
                              day: '$_id.day'
                            }
                          }
                        }
                      },
                      revenue: 1,
                      bookings: 1
                    }
                  }
                ],
                // Top performing tours
                topTours: [
                  {
                    $match: { status: 'confirmed' }
                  },
                  {
                    $group: {
                      _id: '$tour',
                      revenue: { $sum: '$totalPrice' },
                      bookings: { $sum: 1 },
                      avgRating: { $avg: '$tourInfo.averageRating' }
                    }
                  },
                  {
                    $sort: { revenue: -1 }
                  },
                  {
                    $limit: 10
                  },
                  {
                    $lookup: {
                      from: 'tours',
                      localField: '_id',
                      foreignField: '_id',
                      as: 'tourDetails'
                    }
                  },
                  {
                    $unwind: '$tourDetails'
                  },
                  {
                    $project: {
                      _id: 0,
                      tourId: '$_id',
                      title: '$tourDetails.title',
                      revenue: 1,
                      bookings: 1,
                      avgRating: 1,
                      price: '$tourDetails.price'
                    }
                  }
                ],
                // Recent bookings for activity feed
                recentBookings: [
                  {
                    $sort: { createdAt: -1 }
                  },
                  {
                    $limit: 10
                  },
                  {
                    $lookup: {
                      from: 'users',
                      localField: 'user',
                      foreignField: '_id',
                      as: 'userDetails'
                    }
                  },
                  {
                    $lookup: {
                      from: 'tours',
                      localField: 'tour',
                      foreignField: '_id',
                      as: 'tourDetails'
                    }
                  },
                  {
                    $unwind: '$userDetails'
                  },
                  {
                    $unwind: '$tourDetails'
                  },
                  {
                    $project: {
                      _id: 1,
                      bookingId: { $toString: '$_id' },
                      user: '$userDetails.name',
                      tour: '$tourDetails.title',
                      totalPrice: 1,
                      status: 1,
                      participants: 1,
                      bookingDate: 1,
                      createdAt: 1
                    }
                  }
                ]
              }
            }
          ]);

          // Previous period aggregation for comparison
          const prevPeriodAggregation = await Booking.aggregate([
            {
              $match: {
                createdAt: { $gte: prevStartDate, $lte: prevEndDate },
                status: 'confirmed'
              }
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$totalPrice' },
                totalBookings: { $sum: 1 }
              }
            }
          ]);

          // Additional queries for data not in bookings
          const [
            newUsersCount,
            newUsersPrevCount,
            pendingReviewsCount,
            totalToursCount,
            activeToursCount
          ] = await Promise.all([
            User.countDocuments({
              createdAt: { $gte: startDate, $lte: endDate },
              role: 'user'
            }),
            User.countDocuments({
              createdAt: { $gte: prevStartDate, $lte: prevEndDate },
              role: 'user'
            }),
            Review.countDocuments({ status: 'pending' }),
            Tour.countDocuments({}),
            Tour.countDocuments({ status: 'published' })
          ]);

          // Extract results from main aggregation
          const kpiMetrics = mainAggregation[0]?.kpiMetrics[0] || {
            totalRevenue: 0,
            totalBookings: 0,
            confirmedBookings: 0,
            pendingBookings: 0,
            cancelledBookings: 0,
            refundedBookings: 0,
            avgBookingValue: 0
          };

          const revenueOverTime = mainAggregation[0]?.revenueOverTime || [];
          const topTours = mainAggregation[0]?.topTours || [];
          const recentBookings = mainAggregation[0]?.recentBookings || [];

          // Calculate comparison metrics
          const prevPeriodMetrics = prevPeriodAggregation[0] || { totalRevenue: 0, totalBookings: 0 };

          const revenueComparison = prevPeriodMetrics.totalRevenue === 0
            ? 100
            : Math.round(((kpiMetrics.totalRevenue - prevPeriodMetrics.totalRevenue) / prevPeriodMetrics.totalRevenue) * 100);

          const bookingsComparison = prevPeriodMetrics.totalBookings === 0
            ? 100
            : Math.round(((kpiMetrics.confirmedBookings - prevPeriodMetrics.totalBookings) / prevPeriodMetrics.totalBookings) * 100);

          const usersComparison = newUsersPrevCount === 0
            ? 100
            : Math.round(((newUsersCount - newUsersPrevCount) / newUsersPrevCount) * 100);

          // Calculate conversion rate (simplified - would need session data for accurate calculation)
          const conversionRate = totalToursCount > 0
            ? Math.round((kpiMetrics.confirmedBookings / totalToursCount) * 100)
            : 0;

          // Format chart data
          const chartData = revenueOverTime.map((item: any) => ({
            date: item.date,
            revenue: item.revenue,
            bookings: item.bookings
          }));

          // Format top tours data
          const formattedTopTours = topTours.map((tour: any) => ({
            tourId: tour.tourId,
            title: tour.title,
            revenue: tour.revenue,
            bookings: tour.bookings,
            avgRating: tour.avgRating || 0,
            price: tour.price
          }));

          // Format recent bookings data
          const formattedRecentBookings = recentBookings.map((booking: any) => ({
            id: booking.bookingId,
            user: booking.user,
            tour: booking.tour,
            total: booking.totalPrice,
            status: booking.status,
            participants: booking.participants,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt
          }));

          const response = {
            success: true,
            data: {
              // KPI Cards Data
              kpiCards: {
                monthlyRevenue: {
                  value: kpiMetrics.totalRevenue,
                  comparison: revenueComparison,
                  isPositive: revenueComparison >= 0
                },
                newBookings: {
                  value: kpiMetrics.confirmedBookings,
                  comparison: bookingsComparison,
                  isPositive: bookingsComparison >= 0
                },
                newUsers: {
                  value: newUsersCount,
                  comparison: usersComparison,
                  isPositive: usersComparison >= 0
                },
                conversionRate: {
                  value: conversionRate,
                  comparison: null,
                  isPositive: conversionRate > 0
                },
                pendingReviews: {
                  value: pendingReviewsCount,
                  comparison: null,
                  isPositive: false
                }
              },
              // Chart Data
              revenueChartData: chartData,
              // Top Performing Data
              topTours: formattedTopTours,
              // Activity Data
              recentBookings: formattedRecentBookings,
              // Additional Metrics
              additionalMetrics: {
                totalTours: totalToursCount,
                activeTours: activeToursCount,
                avgBookingValue: kpiMetrics.avgBookingValue,
                bookingStatusBreakdown: {
                  confirmed: kpiMetrics.confirmedBookings,
                  pending: kpiMetrics.pendingBookings,
                  cancelled: kpiMetrics.cancelledBookings,
                  refunded: kpiMetrics.refundedBookings
                }
              },
              // Date range info
              dateRange: {
                from: startDate.toISOString(),
                to: endDate.toISOString(),
                period: `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`
              }
            }
          };

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(response));

        } catch (error) {
          console.error('Dashboard API Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: false,
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      });

      // --- Destinations Admin APIs (admin, staff) ---
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/admin/destinations') && !url.startsWith('/api/ai/generate-text')) return next();
        const { parse } = await import('cookie');
        const { verifyJwt } = await import('./src/lib/auth/jwt.js');
        const cookies = parse(req.headers.cookie || '');
        const token = cookies['auth_token'];
        const payload = token ? verifyJwt(token) : null;
        if (!payload || !['admin', 'staff'].includes(payload.role)) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
        await dbConnect();
        const u = new URL(req.originalUrl || url, 'http://localhost');
        try {
          if (url.startsWith('/api/admin/destinations') && req.method === 'GET' && (url === '/api/admin/destinations' || url.startsWith('/api/admin/destinations?'))) {
            const { default: Destination } = await import('./src/models/Destination');
            const search = (u.searchParams.get('search') || '').trim();
            const page = Math.max(1, parseInt(u.searchParams.get('page') || '1', 10));
            const limit = Math.min(100, Math.max(1, parseInt(u.searchParams.get('limit') || '20', 10)));
            const match: any = {};
            if (search) match.name = { $regex: search, $options: 'i' };
            const pipeline: any[] = [
              { $match: match },
              { $lookup: { from: 'tours', localField: '_id', foreignField: 'destination', as: 'tours' } },
              { $lookup: { from: 'bookings', localField: 'tours._id', foreignField: 'tour', as: 'bookings' } },
              { $addFields: { tourCount: { $size: '$tours' }, totalBookings: { $size: '$bookings' }, totalRevenue: { $sum: '$bookings.totalPrice' } } },
              { $project: { bookings: 0 } },
              { $sort: { updatedAt: -1 } },
              { $facet: { rows: [{ $skip: (page - 1) * limit }, { $limit: limit }], total: [{ $count: 'count' }] } },
            ];
            const agg = await (await import('mongoose')).default.connection.collection('destinations').aggregate(pipeline).toArray();
            const total = agg[0]?.total?.[0]?.count || 0;
            const rows = agg[0]?.rows || [];
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: { total, page, limit, rows } }));
          }
          const idMatch = url.match(/^\/api\/admin\/destinations\/([^/]+)$/);
          if (idMatch && req.method === 'GET') {
            const { default: Destination } = await import('./src/models/Destination');
            const { default: Tour } = await import('./src/models/Tour');
            const id = idMatch[1];
            const doc = await Destination.findById(id).lean();
            if (!doc) { res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Not found' })); }
            const tours = await Tour.find({ destination: id }).select('_id title').lean();
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: { ...doc, tours } }));
          }
          if (url === '/api/admin/destinations' && req.method === 'POST') {
            const { default: Destination } = await import('./src/models/Destination');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });

            // Validation: Check required fields
            if (!body.name || !body.slug) {
              res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Name and slug are required' }));
            }

            // Validate slug format (alphanumeric, hyphens, underscores only)
            const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
            if (!slugRegex.test(body.slug)) {
              res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' }));
            }

            // Duplicate check: Check if a destination with the given slug already exists
            const existingDestination = await Destination.findOne({ slug: body.slug });
            if (existingDestination) {
              res.statusCode = 409; res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'A destination with this slug already exists' }));
            }

            // Create the destination with validated data
            const destinationData = {
              name: body.name.trim(),
              slug: body.slug.toLowerCase(),
              description: body.description?.trim(),
              history: body.history?.trim(),
              culture: body.culture?.trim(),
              geography: body.geography?.trim(),
              mainImage: body.mainImage?.trim(),
              imageGallery: Array.isArray(body.imageGallery) ? body.imageGallery : [],
              bestTimeToVisit: body.bestTimeToVisit?.trim(),
              essentialTips: Array.isArray(body.essentialTips) ? body.essentialTips : [],
              status: body.status || 'draft'
            };

            const created = await Destination.create(destinationData);
            res.statusCode = 201; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: created }));
          }
          if (idMatch && req.method === 'PUT') {
            const { default: Destination } = await import('./src/models/Destination');
            const id = idMatch[1];
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const updated = await Destination.findByIdAndUpdate(id, body, { new: true });
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: updated }));
          }
          if (idMatch && req.method === 'DELETE') {
            const { default: Destination } = await import('./src/models/Destination');
            const id = idMatch[1];
            await Destination.findByIdAndDelete(id);
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true }));
          }
          if (url === '/api/ai/generate-text' && req.method === 'POST') {
            // Stub AI generation for now
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { prompt } = body || {};
            const text = `Generated content for prompt: "${prompt || ''}"...\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: text }));
          }
          return next();
        } catch (err: any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });
      // --- Settings Admin APIs (admin only) ---
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/admin/settings') && !url.startsWith('/api/admin/roles') && !url.startsWith('/api/admin/notifications/send-test')) return next();
        const { parse } = await import('cookie');
        const { verifyJwt } = await import('./src/lib/auth/jwt.js');
        const cookies = parse(req.headers.cookie || '');
        const token = cookies['auth_token'];
        const payload = token ? verifyJwt(token) : null;
        if (!payload || payload.role !== 'admin') { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
        await dbConnect();
        try {
          // Settings singleton get/update
          if (url === '/api/admin/settings' && req.method === 'GET') {
            const { default: Settings } = await import('./src/models/Settings');
            const doc = await Settings.findOne({}).lean();
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: doc }));
          }
          if (url === '/api/admin/settings' && req.method === 'PUT') {
            const { default: Settings } = await import('./src/models/Settings');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            let doc = await Settings.findOne({});
            if (!doc) doc = new (await import('./src/models/Settings')).default();
            Object.assign(doc, body);
            await doc.save();
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: doc }));
          }
          // Roles CRUD
          if (url === '/api/admin/roles' && req.method === 'GET') {
            const { default: Role } = await import('./src/models/Role');
            const rows = await Role.find({}).lean();
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url === '/api/admin/roles' && req.method === 'POST') {
            const { default: Role } = await import('./src/models/Role');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const created = await Role.create(body);
            res.statusCode = 201; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: created }));
          }
          const roleMatch = url.match(/^\/api\/admin\/roles\/([^/]+)$/);
          if (roleMatch && req.method === 'PUT') {
            const { default: Role } = await import('./src/models/Role');
            const id = roleMatch[1];
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const updated = await Role.findByIdAndUpdate(id, body, { new: true });
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: updated }));
          }
          if (roleMatch && req.method === 'DELETE') {
            const { default: Role } = await import('./src/models/Role');
            const id = roleMatch[1];
            await Role.findByIdAndDelete(id);
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true }));
          }
          // Notifications: send test email (stub)
          if (url === '/api/admin/notifications/send-test' && req.method === 'POST') {
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, message: 'Test email sent (stub)' }));
          }
          return next();
        } catch (err: any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });
      // --- User Management Center APIs (admin, staff for read; admin for write) ---
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/admin/users')) return next();
        const { parse } = await import('cookie');
        const { verifyJwt } = await import('./src/lib/auth/jwt.js');
        const cookies = parse(req.headers.cookie || '');
        const token = cookies['auth_token'];
        const payload = token ? verifyJwt(token) : null;
        if (!payload) { res.statusCode = 401; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Unauthorized' })); }
        await dbConnect();
        const isAdmin = payload.role === 'admin';
        const isStaff = ['admin', 'staff'].includes(payload.role);

        const full = new URL((req as any).originalUrl || url, 'http://localhost');
        try {
          // PHASE 1: Workhorse aggregation endpoint
          if (req.method === 'GET' && (url === '/api/admin/users' || url.startsWith('/api/admin/users?'))) {
            if (!isStaff) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const page = Math.max(1, parseInt(full.searchParams.get('page') || '1', 10));
            const limit = Math.min(100, Math.max(1, parseInt(full.searchParams.get('limit') || '15', 10)));
            const role = full.searchParams.get('role') || '';
            const status = full.searchParams.get('status') || '';
            const search = (full.searchParams.get('search') || '').trim();

            const match: any = {};
            if (role === 'user') match.role = 'user';
            else if (role === 'partner') match.role = 'partner';
            else if (role === 'staff') match.role = { $in: ['staff', 'admin'] };
            if (status) match.status = status;

            const searchStage = search ? [{
              $match: {
                $or: [
                  { name: { $regex: search, $options: 'i' } },
                  { email: { $regex: search, $options: 'i' } },
                ]
              }
            }] : [];

            const pipeline: any[] = [
              { $match: match },
              ...searchStage,
              { $lookup: { from: 'bookings', localField: '_id', foreignField: 'user', as: 'bookings' } },
              { $lookup: { from: 'tours', localField: '_id', foreignField: 'owner', as: 'tours' } },
              {
                $addFields: {
                  totalBookings: { $size: '$bookings' },
                  totalSpend: { $sum: '$bookings.totalPrice' },
                  tourCount: { $size: '$tours' },
                  avgRating: { $literal: 0 }
                }
              },
              { $project: { password: 0, bookings: 0, tours: 0 } },
              { $sort: { createdAt: -1 } },
              {
                $facet: {
                  users: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                  total: [{ $count: 'count' }]
                }
              }
            ];

            const mongooseMod = await import('mongoose');
            const agg = await mongooseMod.default.connection.collection('users').aggregate(pipeline).toArray();
            const users = agg[0]?.users || [];
            const totalUsers = agg[0]?.total?.[0]?.count || 0;
            const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: { users, pagination: { currentPage: page, totalPages, totalUsers } } }));
          }

          // Alias: POST /api/admin/staff -> existing create staff
          if (req.method === 'POST' && url === '/api/admin/staff') {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { name, email, password, role } = body || {};
            if (!name || !email || !password) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'All fields are required' })); }
            const { default: User } = await import('./src/models/User');
            const existing = await User.findOne({ email: String(email).toLowerCase() });
            if (existing) { res.statusCode = 409; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'User already exists' })); }
            const user = await User.create({ name: name.trim(), email: String(email).toLowerCase(), password, role: role === 'admin' ? 'admin' : 'staff', status: 'active' });
            const safe = user.toObject(); delete (safe as any).password;
            res.statusCode = 201; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: safe }));
          }

          // PHASE 2: Action-oriented CRUD APIs
          // PUT /api/admin/users/:id
          const userIdPut = url.match(/^\/api\/admin\/users\/([^/]+)$/);
          if (req.method === 'PUT' && userIdPut) {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const id = userIdPut[1];
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const allowed: any = {};
            if (body.name !== undefined) allowed.name = body.name;
            if (body.email !== undefined) allowed.email = String(body.email).toLowerCase();
            if (body.role !== undefined) allowed.role = body.role;
            if (body.status !== undefined) allowed.status = body.status;
            const { default: User } = await import('./src/models/User');
            const updated = await User.findByIdAndUpdate(id, allowed, { new: true }).lean();
            if (!updated) { res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'User not found' })); }
            const safe = updated as any; delete safe.password;
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: safe }));
          }

          // PUT /api/admin/users/:id/status
          const userStatusMatch = url.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
          if (req.method === 'PUT' && userStatusMatch) {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const id = userStatusMatch[1];
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { status } = body || {};
            if (!['active', 'suspended', 'pending_approval'].includes(status)) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Invalid status' })); }
            const { default: User } = await import('./src/models/User');
            const updated = await User.findByIdAndUpdate(id, { status }, { new: true }).lean();
            if (!updated) { res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'User not found' })); }
            const safe = updated as any; delete safe.password;
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: safe }));
          }

          // PUT /api/admin/users/:id/role
          const userRoleMatch = url.match(/^\/api\/admin\/users\/([^/]+)\/role$/);
          if (req.method === 'PUT' && userRoleMatch) {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const id = userRoleMatch[1];
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { role } = body || {};
            if (!['user', 'partner', 'staff', 'admin'].includes(role)) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Invalid role' })); }
            const { default: User } = await import('./src/models/User');
            const updated = await User.findByIdAndUpdate(id, { role }, { new: true }).lean();
            if (!updated) { res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'User not found' })); }
            const safe = updated as any; delete safe.password;
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: safe }));
          }

          // DELETE /api/admin/users/:id
          const userIdDel = url.match(/^\/api\/admin\/users\/([^/]+)$/);
          if (req.method === 'DELETE' && userIdDel) {
            if (!isAdmin) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
            const id = userIdDel[1];
            const { default: User } = await import('./src/models/User');
            const deleted = await User.findByIdAndDelete(id);
            if (!deleted) { res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'User not found' })); }
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true }));
          }

          return next();
        } catch (err: any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });
      // --- Moderation APIs (admin, staff) ---
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/admin/reviews') && !url.startsWith('/api/admin/stories')) return next();
        const { parse } = await import('cookie');
        const { verifyJwt } = await import('./src/lib/auth/jwt.js');
        const cookies = parse(req.headers.cookie || '');
        const token = cookies['auth_token'];
        if (!token) { res.statusCode = 401; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Unauthorized' })); }
        const payload = verifyJwt(token);
        if (!payload || !['admin', 'staff'].includes(payload.role)) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
        await dbConnect();
        const method = req.method;
        try {
          // GET queues
          if (method === 'GET' && url.startsWith('/api/admin/reviews')) {
            const { default: Review } = await import('./src/models/Review');
            const { default: User } = await import('./src/models/User');
            const { default: Tour } = await import('./src/models/Tour');
            const u = new URL(url, 'http://localhost');
            const status = u.searchParams.get('status') || 'pending';
            const page = Number(u.searchParams.get('page') || '1');
            const limit = Number(u.searchParams.get('limit') || '20');
            const docs = await Review.find({ status })
              .sort({ createdAt: -1 })
              .skip((page - 1) * limit)
              .limit(limit)
              .populate('user', 'name avatar contributionScore')
              .populate('tour', 'title')
              .lean();
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: docs, total: docs.length }));
          }
          if (method === 'GET' && url.startsWith('/api/admin/stories')) {
            const { default: Story } = await import('./src/models/Story');
            const u = new URL(url, 'http://localhost');
            const status = u.searchParams.get('status') || 'pending';
            const page = Number(u.searchParams.get('page') || '1');
            const limit = Number(u.searchParams.get('limit') || '20');
            const docs = await Story.find({ status })
              .sort({ createdAt: -1 })
              .skip((page - 1) * limit)
              .limit(limit)
              .populate('author', 'name avatar contributionScore')
              .populate('destination', 'name slug')
              .lean();
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: docs, total: docs.length }));
          }
          // BULK UPDATE
          if (method === 'PUT' && url.startsWith('/api/admin/reviews/bulk-update')) {
            const { default: Review } = await import('./src/models/Review');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { action, ids, reason } = body || {};
            if (!Array.isArray(ids) || !ids.length) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'ids required' })); }
            if (action === 'approve') {
              await Review.updateMany({ _id: { $in: ids } }, { $set: { status: 'approved', rejectionReason: undefined } });
            } else if (action === 'reject') {
              await Review.updateMany({ _id: { $in: ids } }, { $set: { status: 'rejected', rejectionReason: reason || '' } });
            } else { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Invalid action' })); }
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true }));
          }
          if (method === 'PUT' && url.startsWith('/api/admin/stories/bulk-update')) {
            const { default: Story } = await import('./src/models/Story');
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { action, ids, reason } = body || {};
            if (!Array.isArray(ids) || !ids.length) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'ids required' })); }
            if (action === 'approve') {
              await Story.updateMany({ _id: { $in: ids } }, { $set: { status: 'approved', rejectionReason: undefined } });
            } else if (action === 'reject') {
              await Story.updateMany({ _id: { $in: ids } }, { $set: { status: 'rejected', rejectionReason: reason || '' } });
            } else { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: false, error: 'Invalid action' })); }
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true }));
          }
          // SINGLE EDIT & APPROVE
          const reviewMatch = url.match(/^\/api\/admin\/reviews\/([^/]+)$/);
          if (method === 'PUT' && reviewMatch) {
            const { default: Review } = await import('./src/models/Review');
            const id = reviewMatch[1];
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { content, action } = body || {};
            const update: any = {};
            if (typeof content === 'string') update.comment = content;
            if (action === 'approve') update.status = 'approved';
            const doc = await Review.findByIdAndUpdate(id, update, { new: true });
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: doc }));
          }
          const storyMatch = url.match(/^\/api\/admin\/stories\/([^/]+)$/);
          if (method === 'PUT' && storyMatch) {
            const { default: Story } = await import('./src/models/Story');
            const id = storyMatch[1];
            const body = await new Promise<any>((resolve, reject) => { let b = ''; req.on('data', (c: any) => b += c); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject); });
            const { content, action, title } = body || {};
            const update: any = {};
            if (typeof title === 'string') update.title = title;
            if (typeof content === 'string') update.content = content;
            if (action === 'approve') update.status = 'approved';
            const doc = await Story.findByIdAndUpdate(id, update, { new: true });
            res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ success: true, data: doc }));
          }
          return next();
        } catch (err: any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });

      // --- Admin Tours APIs (admin, staff) ---
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/admin/tours')) return next();

        try {
          // Temporarily disable authentication for testing
          // const { parse } = await import('cookie');
          // const { verifyJwt } = await import('./src/lib/auth/jwt.js');
          // const cookies = parse(req.headers.cookie || '');
          // const token = cookies['auth_token'];
          // if (!token) { 
          //   res.statusCode = 401; 
          //   res.setHeader('Content-Type','application/json'); 
          //   return res.end(JSON.stringify({ success:false, error:'Unauthorized'})); 
          // }
          // const payload = verifyJwt(token);
          // if (!payload || !['admin','staff'].includes(payload.role)) { 
          //   res.statusCode = 403; 
          //   res.setHeader('Content-Type','application/json'); 
          //   return res.end(JSON.stringify({ success:false, error:'Forbidden'})); 
          // }

          await dbConnect();

          // Import the tours handler dynamically
          const toursHandler = await import('./src/pages/api/admin/tours/index.ts');
          return toursHandler.default(req, res);
        } catch (err: any) {
          console.error('Tours API Error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });
      // GET /api/admin/users/pending-partners (admin, staff)
      server.middlewares.use('/api/admin/users/pending-partners', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        try {
          const { parse } = await import('cookie');
          const { verifyJwt } = await import('./src/lib/auth/jwt.js');
          const cookies = parse(req.headers.cookie || '');
          const token = cookies['auth_token'];
          if (!token) { res.statusCode = 401; return res.end(JSON.stringify({ success: false, error: 'Unauthorized' })); }
          const payload = verifyJwt(token);
          if (!payload || !['admin', 'staff'].includes(payload.role)) { res.statusCode = 403; return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }
          await dbConnect();
          const docs = await User.find({ status: 'pending_approval' }).select('-password').lean();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, data: docs }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });

      // POST /api/admin/users/staff (admin only)
      server.middlewares.use('/api/admin/users/staff', async (req: any, res: any) => {
        try {
          if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' })); }
          const { parse } = await import('cookie');
          const { verifyJwt } = await import('./src/lib/auth/jwt.js');
          const cookies = parse(req.headers.cookie || '');
          const token = cookies['auth_token'];
          if (!token) { res.statusCode = 401; return res.end(JSON.stringify({ success: false, error: 'Unauthorized' })); }
          const payload = verifyJwt(token);
          if (!payload || payload.role !== 'admin') { res.statusCode = 403; return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }

          // parse body
          const body = await new Promise<any>((resolve, reject) => {
            let b = ''; req.on('data', (c: any) => b += c.toString()); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject);
          });
          const { name, email, password } = body || {};
          if (!name || !email || !password) { res.statusCode = 400; return res.end(JSON.stringify({ success: false, error: 'All fields are required' })); }

          await dbConnect();
          const existing = await User.findOne({ email: String(email).toLowerCase() });
          if (existing) { res.statusCode = 409; return res.end(JSON.stringify({ success: false, error: 'User already exists' })); }
          const user = await User.create({ name: name.trim(), email: String(email).toLowerCase(), password, role: 'staff', status: 'active' });
          const safe = user.toObject(); delete (safe as any).password;
          res.statusCode = 201; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ success: true, data: safe }));
        } catch (err: any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });

      // PUT /api/admin/users/:userId/approve-partner (admin, staff)
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        const match = url.match(/^\/api\/admin\/users\/([^/]+)\/approve-partner$/);
        if (!match) return next();
        if (req.method !== 'PUT') { res.statusCode = 405; return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' })); }
        try {
          const { parse } = await import('cookie');
          const { verifyJwt } = await import('./src/lib/auth/jwt.js');
          const cookies = parse(req.headers.cookie || '');
          const token = cookies['auth_token'];
          if (!token) { res.statusCode = 401; return res.end(JSON.stringify({ success: false, error: 'Unauthorized' })); }
          const payload = verifyJwt(token);
          if (!payload || !['admin', 'staff'].includes(payload.role)) { res.statusCode = 403; return res.end(JSON.stringify({ success: false, error: 'Forbidden' })); }

          const userId = match[1];
          await dbConnect();
          const user = await User.findById(userId);
          if (!user) { res.statusCode = 404; return res.end(JSON.stringify({ success: false, error: 'User not found' })); }
          user.role = 'partner';
          user.status = 'active';
          await user.save();
          const safe = user.toObject(); delete (safe as any).password;
          res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ success: true, data: safe }));
        } catch (err: any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });
      server.middlewares.use('/api/seed', async (req, res) => {
        if (req.method !== 'POST') return; // Only accept POST requests
        try {
          console.log('[VITE SERVER] POST /api/seed received. Triggering seeder...');
          await seedDatabase();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, message: 'Database seeded successfully!' }));
        } catch (error: any) {
          console.error('[VITE SERVER] Seeding failed:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: `Seeding failed: ${error.message}` }));
        }
      });
    },
  };
}

// Dev-only API endpoints for homepage data
function homeApiPlugin() {
  return {
    name: 'vite-plugin-home-api',
    configureServer(server: ViteDevServer) {
      // GET /api/home/featured-destinations
      server.middlewares.use('/api/home/featured-destinations', async (req, res) => {
        if (req.method !== 'GET') return;
        try {
          await dbConnect();
          // Logic: Fetch top 6 destinations, sorted by newest for now
          const destinations = await Destination.find({}).sort({ createdAt: -1 }).limit(6).lean();
          console.log(`[VITE API] Featured Destinations count=${destinations.length}`);
          if (destinations[0]) {
            console.log('[VITE API] First Destination:', JSON.stringify(destinations[0], null, 2));
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, data: destinations }));
        } catch (error: any) {
          console.error('[VITE API] Featured Destinations Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Failed to fetch featured destinations' }));
        }
      });

      // GET /api/home/featured-tours
      server.middlewares.use('/api/home/featured-tours', async (req, res) => {
        if (req.method !== 'GET') return;
        try {
          await dbConnect();
          // Logic: Fetch top 6 tours, sorted by average rating
          // CRITICAL: Populate the destination to get its name for display purposes
          const tours = await Tour.find({})
            .sort({ averageRating: -1, reviewCount: -1, createdAt: -1 })
            .limit(6)
            .populate('destination', 'name slug')
            .lean();
          console.log(`[VITE API] Featured Tours count=${tours.length}`);
          if (tours[0]) {
            console.log('[VITE API] First Tour:', JSON.stringify(tours[0], null, 2));
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, data: tours }));
        } catch (error: any) {
          console.error('[VITE API] Featured Tours Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Failed to fetch featured tours' }));
        }
      });

      // GET /api/destinations/lookup?ids=comma,separated
      server.middlewares.use('/api/destinations/lookup', async (req, res) => {
        if (req.method !== 'GET') return;
        try {
          await dbConnect();
          const url = new URL(req.url || '', 'http://localhost');
          const idsParam = url.searchParams.get('ids');
          const ids = (idsParam || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          if (!ids.length) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: [] }));
            return;
          }
          const docs = await Destination.find({ _id: { $in: ids } }).lean();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, data: docs }));
        } catch (error: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: error.message }));
        }
      });

      // POST /api/media/upload - Self-hosted image upload (Early middleware for stream control)
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.originalUrl || req.url || '';
        const method = req.method;

        // Route: POST /api/media/upload
        if (url.startsWith('/api/media/upload') && method === 'POST') {
          console.log(`[API ROUTER] Matched POST /api/media/upload. Forwarding to handler.`);
          console.log(`[VITE API] Content-Type: ${req.headers['content-type']}`);
          console.log(`[VITE API] Content-Length: ${req.headers['content-length']}`);

          try {
            // Import the media handler
            const { handleImageUpload } = await import('./src/lib/api/mediaHandler');
            console.log(`[VITE API] Calling handleImageUpload...`);
            // The `await` here is important as our handler now returns a Promise
            await handleImageUpload(req, res);
            console.log(`[VITE API] handleImageUpload completed`);
            return; // Don't call next() - we've handled the request
          } catch (error: any) {
            console.error('[VITE API] Image upload error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: 'Lỗi server, vui lòng thử lại sau'
            }));
            return; // Don't call next() - we've handled the request
          }
        }

        // Continue to next middleware for other routes
        next();
      });

      // POST /api/stories - Create new story
      server.middlewares.use('/api/stories', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') {
          return next();
        }

        try {
          // Import the story handler
          const { handleCreateStory } = await import('./src/lib/api/storyHandler');
          await handleCreateStory(req, res);
        } catch (error: any) {
          console.error('[VITE API] Create story error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: false,
            error: 'Lỗi server, vui lòng thử lại sau'
          }));
        }
      });

      // GET /api/destinations/search?q=query&limit=10
      server.middlewares.use('/api/destinations/search', async (req: any, res: any) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
        }

        try {
          await dbConnect();

          // Parse URL properly, handling both req.url and req.originalUrl
          const fullUrl = req.originalUrl || req.url || '';
          let query: string | null = null;
          let limit: string = '10';

          try {
            // Try parsing as full URL first
            const url = new URL(fullUrl, 'http://localhost');
            query = url.searchParams.get('q');
            limit = url.searchParams.get('limit') || '10';
          } catch (e) {
            // Fallback: manual parsing
            const urlMatch = fullUrl.match(/[?&]q=([^&]+)/);
            if (urlMatch) {
              query = decodeURIComponent(urlMatch[1]);
            }
            const limitMatch = fullUrl.match(/[?&]limit=(\d+)/);
            if (limitMatch) {
              limit = limitMatch[1];
            }
          }

          const limitNum = Math.min(parseInt(limit) || 10, 20); // Max 20 results

          if (!query || query.trim().length === 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: true,
              data: [],
              total: 0
            }));
          }

          const searchQuery = decodeURIComponent(query).trim();

          // Search destinations by name, description, or location
          const destinations = await Destination.find({
            $and: [
              { status: 'published' }, // Only published destinations
              {
                $or: [
                  { name: { $regex: searchQuery, $options: 'i' } },
                  { description: { $regex: searchQuery, $options: 'i' } },
                  { location: { $regex: searchQuery, $options: 'i' } }
                ]
              }
            ]
          })
            .select('name slug location image')
            .limit(limitNum)
            .lean();

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            data: destinations,
            total: destinations.length
          }));

        } catch (error: any) {
          console.error('[VITE API] Destination search error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: false,
            error: 'Lỗi server, vui lòng thử lại sau'
          }));
        }
      });

      // GET /api/destinations/:slug (dynamic)
      server.middlewares.use('/api/destinations/', async (req: any, res: any, next: any) => {
        try {
          if (req.method !== 'GET') return next();
          // Avoid intercepting the lookup route above
          const original = req.originalUrl || req.url || '';
          if (original.startsWith('/api/destinations/lookup')) return next();
          if (original.startsWith('/api/destinations/search')) return next();

          // Extract slug from URL path
          // URL format: /api/destinations/slug-here
          const urlPath = original.split('?')[0]; // Remove query params
          const pathParts = urlPath.split('/');
          const slugIndex = pathParts.indexOf('destinations');
          if (slugIndex === -1 || slugIndex >= pathParts.length - 1) return next();

          // Decode URL-encoded slug
          const slug = decodeURIComponent(pathParts[slugIndex + 1]);
          if (!slug) return next();

          const { handleGetDestinationBySlug } = await import('./src/lib/api/destinationHandler');
          console.log(`[VITE API] GET /api/destinations/${slug}`);
          await handleGetDestinationBySlug(req, res, slug);
        } catch (error: any) {
          console.error('[VITE API] Destination by slug error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
    },
  };
}

// Dev-only API endpoints for authentication
function authApiPlugin() {
  return {
    name: 'vite-plugin-auth-api',
    configureServer(server: ViteDevServer) {
      // Helper to parse JSON body from Node.js request
      function parseBody(req: any) {
        return new Promise((resolve, reject) => {
          let body = '';
          req.on('data', (chunk: any) => body += chunk.toString());
          req.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (err) {
              reject(new Error('Invalid JSON'));
            }
          });
          req.on('error', (err: any) => reject(err));
        });
      }

      // POST /api/auth/register
      server.middlewares.use('/api/auth/register', async (req: any, res: any) => {
        // Heartbeat log
        console.log(`[VITE API] Received request on /api/auth/register with method: ${req.method}`);

        res.setHeader('Content-Type', 'application/json'); // Set header for all responses

        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
        }

        try {
          // Parse request body first
          const { name, email, password, accountType } = await parseBody(req) as any;

          // --- Server-Side Validation ---
          if (!name || !email || !password) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: 'All fields are required.' }));
          }

          // Email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: 'Invalid email format.' }));
          }

          // Password length validation
          if (password.length < 6) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: 'Password must be at least 6 characters.' }));
          }

          // Determine accountType ('user' | 'partner')
          const requestedType = (accountType === 'partner') ? 'partner' : 'user';

          // Check if MONGODB_URI is available
          if (!process.env.MONGODB_URI) {
            res.statusCode = 503;
            return res.end(JSON.stringify({
              success: false,
              error: 'Database connection not configured. Please set MONGODB_URI environment variable.'
            }));
          }

          // Connect to DB
          await dbConnect();

          // --- Business Logic ---
          const existingUser = await User.findOne({ email: email.toLowerCase() });
          if (existingUser) {
            res.statusCode = 409;
            return res.end(JSON.stringify({ success: false, error: 'User with this email already exists.' }));
          }

          // Create user with appropriate status (partner requests are pending approval)
          const userData = {
            name: name.trim(),
            email: email.toLowerCase(),
            password,
            role: 'user',
            status: requestedType === 'partner' ? 'pending_approval' : 'active'
          };

          const user = await User.create(userData);

          // Remove password from response
          const userResponse = user.toObject();
          delete userResponse.password;

          console.log(`[VITE API] User created successfully: ${user.email} with role: ${user.role}`);

          // --- Success Response ---
          res.statusCode = 201;
          res.end(JSON.stringify({ success: true, data: userResponse }));

        } catch (error: any) {
          // --- Error Handling Safety Net ---
          console.error('[VITE API Register Error]', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: 'An internal server error occurred.' }));
        }
      });

      // POST /api/auth/login
      server.middlewares.use('/api/auth/login', async (req: any, res: any) => {
        console.log(`[VITE API] Received request on /api/auth/login with method: ${req.method}`);

        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
        }

        try {
          await dbConnect();

          const { email, password } = await parseBody(req) as any;
          console.log(`[Login API] Attempting login for email: ${email}`);

          // Validation
          if (!email || !password) {
            console.log('[Login API] FAILED: Missing email or password');
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: 'Email and password are required.' }));
          }

          // Find user and include password for comparison
          const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
          if (!user) {
            console.log(`[Login API] FAILED: User not found for email: ${email}`);
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: 'Invalid credentials.' }));
          }

          console.log(`[Login API] SUCCESS: User found. Stored hash: ${user.password}`);

          // Check if user is pending approval
          if (user.status === 'pending_approval') {
            console.log(`[Login API] FAILED: User ${user.email} is pending approval`);
            res.statusCode = 403;
            return res.end(JSON.stringify({ success: false, error: 'Tài khoản của bạn đang chờ phê duyệt.' }));
          }

          // Verify password
          console.log(`[Login API] Attempting password verification for user: ${user.email}`);
          const isValidPassword = await user.comparePassword(password);
          if (!isValidPassword) {
            console.log(`[Login API] FAILED: Password comparison returned false for user: ${user.email}`);
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: 'Invalid credentials.' }));
          }

          console.log(`[Login API] SUCCESS: Password matched for user: ${user.email}`);

          // Generate JWT token
          const { signJwt } = await import('./src/lib/auth/jwt.js');
          const token = signJwt({ userId: String(user._id), role: user.role });

          // Set HTTP-only cookie
          const { serialize } = await import('cookie');
          const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });

          // Remove password from response
          const userResponse = user.toObject();
          delete userResponse.password;

          console.log(`[VITE API] User logged in successfully: ${user.email}`);

          res.statusCode = 200;
          res.setHeader('Set-Cookie', cookie);
          res.end(JSON.stringify({ success: true, data: userResponse }));

        } catch (error: any) {
          console.error('[VITE API Login Error]', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: 'An internal server error occurred.' }));
        }
      });

      // POST /api/auth/logout
      server.middlewares.use('/api/auth/logout', async (req: any, res: any) => {
        console.log(`[VITE API] Received request on /api/auth/logout with method: ${req.method}`);

        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
        }

        try {
          const { serialize } = await import('cookie');
          const cookie = serialize('auth_token', '', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
          });

          res.statusCode = 200;
          res.setHeader('Set-Cookie', cookie);
          res.end(JSON.stringify({ success: true, message: 'Logged out successfully' }));

        } catch (error: any) {
          console.error('[VITE API Logout Error]', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: 'An internal server error occurred.' }));
        }
      });

      // GET /api/auth/me
      server.middlewares.use('/api/auth/me', async (req: any, res: any) => {
        console.log(`[VITE API] Received request on /api/auth/me with method: ${req.method}`);

        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'GET') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
        }

        try {
          const { parse } = await import('cookie');
          const { verifyJwt } = await import('./src/lib/auth/jwt.js');

          const cookies = parse(req.headers.cookie || '');
          const token = cookies['auth_token'];

          if (!token) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: 'No authentication token provided.' }));
          }

          const payload = verifyJwt(token);
          if (!payload) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: 'Invalid authentication token.' }));
          }

          await dbConnect();
          const user = await User.findById(payload.userId);

          if (!user) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ success: false, error: 'User not found.' }));
          }

          const userResponse = user.toObject();
          delete userResponse.password;

          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, data: userResponse }));

        } catch (error: any) {
          console.error('[VITE API Me Error]', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: 'An internal server error occurred.' }));
        }
      });

      // GET /api/auth/test - Simple test endpoint
      server.middlewares.use('/api/auth/test', async (req: any, res: any) => {
        console.log(`[VITE API] Received request on /api/auth/test with method: ${req.method}`);

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          message: 'Auth API is working!',
          timestamp: new Date().toISOString(),
          mongodb_uri: process.env.MONGODB_URI ? 'Configured' : 'Not configured'
        }));
      });

      // POST /api/auth/create-admin - Admin creation endpoint for testing
      server.middlewares.use('/api/auth/create-admin', async (req: any, res: any) => {
        console.log(`[VITE API] Received request on /api/auth/create-admin with method: ${req.method}`);

        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
        }

        try {
          await dbConnect();

          const { name, email, password } = await parseBody(req) as any;

          // Validation
          if (!name || !email || !password) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: 'All fields are required.' }));
          }

          // Check if admin already exists
          const existingAdmin = await User.findOne({ email: email.toLowerCase() });
          if (existingAdmin) {
            res.statusCode = 409;
            return res.end(JSON.stringify({ success: false, error: 'Admin with this email already exists.' }));
          }

          // Create admin user
          const adminData = {
            name: name.trim(),
            email: email.toLowerCase(),
            password,
            role: 'admin',
            status: 'active'
          };

          const admin = new User(adminData);
          await admin.save();

          // Remove password from response
          const adminResponse = admin.toObject();
          delete adminResponse.password;

          console.log(`[VITE API] Admin created successfully: ${admin.email} with role: ${admin.role}`);

          res.statusCode = 201;
          res.end(JSON.stringify({ success: true, data: adminResponse }));

        } catch (error: any) {
          console.error('[VITE API Create Admin Error]', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: 'An internal server error occurred.' }));
        }
      });
    },
  };
}

// Dev-only Public Tours Search API
function publicToursApiPlugin() {
  return {
    name: 'vite-plugin-public-tours-api',
    configureServer(server: ViteDevServer) {
      // Route: GET /api/tours/search
      server.middlewares.use('/api/tours/search', async (req: any, res: any, next: any) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
        }
        try {
          const handler = await import('./src/pages/api/tours/search');
          return handler.default(req, res);
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });

      // Route: GET /api/tours/:id
      server.middlewares.use('/api/tours/', async (req: any, res: any, next: any) => {
        try {
          if (req.method !== 'GET') return next();
          const seg = (req.url || '').replace(/^\/?/, '');
          // Ignore search which is handled above
          if (!seg || seg.startsWith('search')) return next();
          const { handleGetTourById } = await import('./src/lib/api/tourHandler');
          console.log(`[VITE API] GET /api/tours/${seg}`);
          await handleGetTourById(req, res, seg);
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });
    },
  };
}

// Dev-only User Journeys API
function userJourneysApiPlugin() {
  return {
    name: 'vite-plugin-user-journeys-api',
    configureServer(server: ViteDevServer) {
      // Route: GET /api/users/journeys
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/users/journeys')) return next();
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
        }

        try {
          console.log(`[VITE API] GET /api/users/journeys - Forwarding to handler`);
          const { handleGetUserJourneys } = await import('./src/lib/api/journeysHandler');
          return await handleGetUserJourneys(req, res);
        } catch (err: any) {
          console.error('[VITE API] User Journeys Error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
        }
      });
    },
  };
}

// Dev-only Community Hub API
function communityHubApiPlugin() {
  return {
    name: 'vite-plugin-community-hub-api',
    configureServer(server: ViteDevServer) {
      // Route: GET /api/community/hub
      server.middlewares.use('/api/community/hub', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
        }

        try {
          console.log('[VITE API] GET /api/community/hub - Processing request...');

          // Import required modules
          const { default: dbConnect } = await import('./src/lib/dbConnect.js');
          const { default: Story } = await import('./src/models/Story.js');
          const { default: User } = await import('./src/models/User.js');

          // Connect to database
          await dbConnect();

          // Execute all queries in parallel for maximum performance
          const [
            featuredStory,
            latestStories,
            trendingTags,
            topAuthors,
            totalStories,
            totalMembers,
            storiesThisWeek
          ] = await Promise.all([
            // Featured Story: Get the story with highest likeCount that is approved
            Story.findOne({ status: 'approved' })
              .sort({ likeCount: -1 })
              .populate('author', 'name avatar')
              .lean(),

            // Latest Stories: Get 5 most recent stories (all statuses)
            Story.find({})
              .sort({ createdAt: -1 })
              .limit(5)
              .populate('author', 'name avatar')
              .lean(),

            // Trending Tags: MongoDB aggregation pipeline
            Story.aggregate([
              { $unwind: '$tags' },
              { $group: { _id: '$tags', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 5 },
              { $project: { tag: '$_id', count: 1, _id: 0 } }
            ]),

            // Top Authors: Complex aggregation to get authors with most stories and likes
            Story.aggregate([
              {
                $group: {
                  _id: '$author',
                  storyCount: { $sum: 1 },
                  totalLikes: { $sum: '$likeCount' }
                }
              },
              { $sort: { totalLikes: -1, storyCount: -1 } },
              { $limit: 3 },
              {
                $lookup: {
                  from: 'users',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'authorInfo'
                }
              },
              { $unwind: '$authorInfo' },
              {
                $project: {
                  _id: '$authorInfo._id',
                  name: '$authorInfo.name',
                  avatar: '$authorInfo.avatar',
                  followerCount: { $ifNull: ['$authorInfo.contributionScore', 0] },
                  storyCount: 1
                }
              }
            ]),

            // Community Stats: Total stories (true total count)
            Story.estimatedDocumentCount(),

            // Community Stats: Total members (true total count)
            User.estimatedDocumentCount(),

            // Community Stats: Stories this week
            Story.countDocuments({
              status: 'approved',
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            })
          ]);

          // Transform the data to match our API contract
          const communityHubData = {
            featuredStory: featuredStory ? {
              _id: featuredStory._id.toString(),
              title: featuredStory.title,
              content: featuredStory.content,
              coverImage: featuredStory.coverImage,
              tags: featuredStory.tags,
              likeCount: featuredStory.likeCount,
              createdAt: featuredStory.createdAt.toISOString(),
              author: featuredStory.author ? {
                _id: (featuredStory.author as any)._id?.toString() || 'unknown',
                name: (featuredStory.author as any).name || 'Unknown User',
                avatar: (featuredStory.author as any).avatar
              } : { _id: 'unknown', name: 'Unknown User', avatar: '' }
            } : null,

            latestStories: latestStories.map(story => ({
              _id: story._id.toString(),
              title: story.title,
              content: story.content,
              coverImage: story.coverImage,
              tags: story.tags,
              likeCount: story.likeCount,
              createdAt: story.createdAt.toISOString(),
              author: story.author ? {
                _id: (story.author as any)._id?.toString() || 'unknown',
                name: (story.author as any).name || 'Unknown User',
                avatar: (story.author as any).avatar
              } : { _id: 'unknown', name: 'Unknown User', avatar: '' }
            })),

            trendingTags: trendingTags.map(tag => ({
              tag: tag.tag,
              count: tag.count
            })),

            topAuthors: topAuthors.map(author => ({
              _id: author._id.toString(),
              name: author.name,
              avatar: author.avatar,
              followerCount: author.followerCount,
              storyCount: author.storyCount
            })),

            communityStats: {
              totalStories,
              totalMembers,
              storiesThisWeek
            }
          };

          console.log('[VITE API] Community hub data fetched successfully');

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            data: communityHubData,
            cached: false
          }));

        } catch (error: any) {
          console.error('[VITE API] Community Hub error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: error.message || 'Server error' }));
        }
      });
    },
  };
}

// --- MAIN VITE CONFIGURATION (The single, authoritative export) ---
export default defineConfig(({ command, mode }) => {
  // Use Vite's native `loadEnv` to correctly read .env files for the current mode.
  const env = loadEnv(mode, process.cwd(), '');

  // --- THE DEFINITIVE FIX ---
  // Rationale: `loadEnv` does NOT automatically populate `process.env`. We must
  // manually assign every server-side variable that our application's backend
  // logic (like auth utilities) will need.
  process.env.MONGODB_URI = env.MONGODB_URI; // Keep existing variables
  process.env.JWT_SECRET = env.JWT_SECRET || 'dev_secret_change_me'; // <--- ADDED FALLBACK TO MATCH SERVER
  process.env.JWT_EXPIRES_IN = env.JWT_EXPIRES_IN; // Also propagate this for the login endpoint
  // --- END DEFINITIVE FIX ---

  // Add a check to warn the developer if the secret is missing.
  if (!process.env.JWT_SECRET) {
    console.warn("⚠️ WARNING: JWT_SECRET is not defined in your .env file. Authentication will fail.");
  }

  // A warning for developers if the environment variable is missing.
  if (!process.env.MONGODB_URI && mode === 'development') {
    console.warn("⚠️ WARNING: MONGODB_URI is not defined in your .env.local file. The seeding API will fail.");
  }

  // Only load these plugins during development (serve)
  // They are not needed for the build and are causing the EISDIR error
  const isDev = command === 'serve';

  return {
    plugins: [
      react(),
      // --- DISABLED PLUGINS (Using Real Backend at port 4000 instead) ---
      // isDev && mode === 'development' ? seedApiPlugin() : null,
      // isDev && mode === 'development' ? homeApiPlugin() : null,
      // isDev && mode === 'development' ? publicToursApiPlugin() : null,
      // isDev && mode === 'development' ? userJourneysApiPlugin() : null,
      // isDev && mode === 'development' ? communityHubApiPlugin() : null,
      // isDev && mode === 'development' ? profileApiPlugin() : null,
      // isDev && mode === 'development' ? chatApiPlugin(env) : null,
      // isDev && mode === 'development' ? plannerApiPlugin(env) : null,
      // isDev && mode === 'development' ? shareApiPlugin() : null,
      // isDev && mode === 'development' ? notificationApiPlugin() : null,

    ].filter(Boolean) as any,
    server: {
      proxy: {
        // --- PROXY ALL API REQUESTS TO BACKEND (Port 4000) ---
        // This ensures Local Dev matches Production logic.
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        '/api/partner': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        // Proxy /api/auth/* to Backend at 4000
        '/api/auth': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        // Proxy /api/upload/* to Backend at 4000
        '/api/upload': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        // Proxy /api/hotels/* to Backend at 4000
        '/api/hotels': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        // Proxy /api/bookings/* to Backend at 4000
        '/api/bookings': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        // Proxy /api/chat/* to Backend at 4000
        '/api/chat': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        // Proxy /api/flights/* to Backend at 4000
        '/api/flights': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        // Proxy /api/transport/* to Backend at 4000
        '/api/transport': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        // Proxy /api/community/* to Backend at 4000
        '/api/community': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        // Proxy /api/stories/* to Backend at 4000
        '/api/stories': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        // Proxy /api/ai-tours/* to AI service at /v1/tours/*
        '/api/ai-tours': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/ai-tours/, '/v1/tours')
        },
        // Proxy /api/agents/* to AI service at /v1/agents/*
        '/api/agents': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/v1')
        },
        // Proxy /api/itineraries to AI service at /v1/itineraries
        '/api/itineraries': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/v1')
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
