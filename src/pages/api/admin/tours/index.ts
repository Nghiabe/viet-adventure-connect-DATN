// src/pages/api/admin/tours/index.ts
import type { IncomingMessage, ServerResponse } from 'http';
import dbConnect from '../../../../lib/dbConnect';
import Tour from '../../../../models/Tour';
import mongoose from 'mongoose';
import { z } from 'zod';

/**
 * Simple JSON responder
 */
function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/**
 * Zod schemas
 */
const ObjectIdString = z
  .string()
  .refine((s) => mongoose.Types.ObjectId.isValid(s), { message: 'Invalid ObjectId' });

const DestinationItemSchema = z.object({
  destinationId: ObjectIdString,
  orderIndex: z.number().int().min(1),
  note: z.string().optional(),
});

const ItineraryItemSchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1, 'Description is required'),
});

const TourCreationSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  // accept numbers or numeric strings
  price: z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().min(0)),
  duration: z.string().min(1),
  maxGroupSize: z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().int().positive().optional()),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  itinerary: z.array(ItineraryItemSchema).optional(),
  mainImage: z.string().optional(),
  imageGallery: z.array(z.string()).optional(),
  // Accept either a single destination (legacy) or an array of destinations (new)
  destination: ObjectIdString.optional(),
  destinations: z.array(DestinationItemSchema).optional(),
  // owner will be fetched from req.user when possible; but accept if provided
  owner: ObjectIdString.optional(),
});

/**
 * Handler
 *
 * Note: If you wrap this handler with an auth middleware like `withRole`, that middleware should attach
 * `req.user` with at least `_id` property (the owner's ObjectId string). This handler will prefer req.user._id.
 */
async function handler(req: IncomingMessage & { user?: any }, res: ServerResponse) {
  const handlerName = '/api/admin/tours';
  try {
    console.log(`[${handlerName}] Starting request processing...`);
    await dbConnect();
    console.log(`[${handlerName}] Database connected successfully.`);

    // -------------------
    // GET: list + pagination (kept from original)
    // -------------------
    if (req.method === 'GET') {
      console.log(`[${handlerName}] Received GET request.`);

      const url = new URL(req.url || '', 'http://localhost');
      const {
        page = '1',
        limit = '10',
        status,
        destinationId,
        ownerId,
        search,
      } = Object.fromEntries(url.searchParams);

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
      const skip = (pageNum - 1) * limitNum;

      const matchStage: any = {};
      if (status) matchStage.status = status;
      if (destinationId && mongoose.Types.ObjectId.isValid(destinationId)) matchStage.destination = new mongoose.Types.ObjectId(destinationId);
      if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) matchStage.owner = new mongoose.Types.ObjectId(ownerId);
      if (search) matchStage.title = { $regex: search, $options: 'i' };

      console.log(`[${handlerName}] Executing aggregation with match stage:`, matchStage);
      console.log(`[${handlerName}] Pagination: page=${pageNum}, limit=${limitNum}, skip=${skip}`);

      const pipeline: mongoose.PipelineStage[] = [
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $skip: skip },
              { $limit: limitNum },
              { $lookup: { from: 'users', localField: 'owner', foreignField: '_id', as: 'ownerInfo' } },
              { $lookup: { from: 'destinations', localField: 'destination', foreignField: '_id', as: 'destinationInfo' } },
              { $lookup: { from: 'bookings', localField: '_id', foreignField: 'tour', as: 'bookings' } },
              { $unwind: { path: "$ownerInfo", preserveNullAndEmptyArrays: true } },
              { $unwind: { path: "$destinationInfo", preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  mainImage: 1,
                  price: 1,
                  averageRating: 1,
                  reviewCount: 1,
                  status: 1,
                  owner: {
                    _id: { $ifNull: ["$ownerInfo._id", null] },
                    name: { $ifNull: ["$ownerInfo.name", "N/A"] },
                  },
                  destination: {
                    _id: { $ifNull: ["$destinationInfo._id", null] },
                    name: { $ifNull: ["$destinationInfo.name", "N/A"] },
                  },
                  bookingCount: { $size: "$bookings" },
                  totalRevenue: { $sum: "$bookings.totalPrice" },
                },
              },
            ],
          },
        },
      ];

      console.log(`[${handlerName}] Executing aggregation pipeline...`);
      const [results] = await Tour.aggregate(pipeline);
      const tours = (results && results.data) || [];
      const totalTours = results?.metadata?.[0]?.total || 0;
      const totalPages = Math.ceil(totalTours / limitNum);

      console.log(`[${handlerName}] Aggregation successful. Found ${totalTours} total tours, returning ${tours.length}.`);

      return send(res, 200, {
        success: true,
        data: {
          tours,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalTours,
          },
        },
      });
    }

    // -------------------
    // POST: create tour — supports destinations[] and legacy destination
    // -------------------
    if (req.method === 'POST') {
      console.log(`[${handlerName}] Received POST request.`);

      // read raw body
      let raw = '';
      await new Promise<void>((resolve, reject) => {
        req.on('data', (chunk: any) => {
          raw += chunk.toString();
          // guard: if extremely large, reject
          if (raw.length > 10 * 1024 * 1024) { // 10MB
            reject(new Error('Payload too large'));
            req.destroy();
          }
        });
        req.on('end', () => resolve());
        req.on('error', (err) => reject(err));
      });

      console.log(`[${handlerName}] Received raw body length=${raw.length}`);
      const parsed = raw ? JSON.parse(raw) : {};
      console.log(`[${handlerName}] Parsed body:`, parsed);

      // Validate with Zod
      const safe = TourCreationSchema.safeParse(parsed);
      if (!safe.success) {
        console.error(`--- CREATE TOUR API FAILED (validation) ---`, safe.error.format());
        // Convert zod issues to simple array for frontend
        const details = (safe.error.issues || []).map((iss) => ({ path: iss.path, message: iss.message }));
        return send(res, 400, { success: false, error: 'Invalid data provided.', details });
      }

      const data = safe.data as any;

      // Get owner from req.user if available (preferred), otherwise fallback to body.owner
      const ownerFromReq = (req as any).user?._id || (req as any).user?.id || undefined;
      const ownerIdStr = ownerFromReq || data.owner;
      if (!ownerIdStr || !mongoose.Types.ObjectId.isValid(ownerIdStr)) {
        return send(res, 400, { success: false, error: 'Invalid or missing owner (must be authenticated)' });
      }

      // Normalize itinerary: ensure every item has non-empty description (avoid mongoose required error)
      const safeItinerary = Array.isArray(data.itinerary)
        ? data.itinerary.map((it: any, idx: number) => ({
            day: it.day ?? idx + 1,
            title: it.title ?? `Ngày ${it.day ?? idx + 1}`,
            description: (typeof it.description === 'string' && it.description.trim().length > 0)
              ? it.description
              : (it.title ?? `Ngày ${it.day ?? idx + 1}`),
          }))
        : [];

      // Build destinations array (if provided)
      let destinationsToSave: any[] = [];
      if (Array.isArray(data.destinations) && data.destinations.length > 0) {
        destinationsToSave = data.destinations.map((d: any, idx: number) => ({
          destinationId: d.destinationId,
          orderIndex: d.orderIndex ?? idx + 1,
          note: d.note ?? '',
        }));
      } else if (data.destination) {
        // legacy single destination provided
        destinationsToSave = [{ destinationId: data.destination, orderIndex: 1, note: '' }];
      }

      // Determine primary destination (legacy field)
      const primaryDestination = destinationsToSave.length > 0 ? destinationsToSave[0].destinationId : undefined;

      // Build tour doc to persist
      const tourDoc: any = {
        title: data.title,
        slug: data.slug,
        description: data.description ?? '',
        price: data.price,
        duration: data.duration,
        maxGroupSize: data.maxGroupSize ?? undefined,
        status: data.status ?? 'draft',
        inclusions: data.inclusions ?? [],
        exclusions: data.exclusions ?? [],
        itinerary: safeItinerary,
        mainImage: data.mainImage ?? undefined,
        imageGallery: data.imageGallery ?? [],
        // store both fields for compatibility
        destinations: destinationsToSave,
        destination: primaryDestination,
        owner: new mongoose.Types.ObjectId(ownerIdStr),
      };

      try {
        const created = await Tour.create(tourDoc);
        // Optionally populate nested destination names and owner name before returning
        await created.populate([
          { path: 'owner', select: 'name gid email' },
          { path: 'destinations.destinationId', select: 'name slug' },
        ]).execPopulate?.().catch(() => null);

        console.log(`[${handlerName}] Tour created: ${created._id}`);
        return send(res, 201, { success: true, data: created });
      } catch (err: any) {
        console.error(`--- CREATE TOUR API FAILED (mongoose) ---`, err);
        // Map mongoose validation errors to details
        if (err?.errors) {
          const details: any[] = [];
          for (const k of Object.keys(err.errors)) {
            const e = err.errors[k];
            details.push({ path: [k], message: e?.message || String(e) });
          }
          return send(res, 400, { success: false, error: 'Invalid data provided.', details });
        }
        return send(res, 500, { success: false, error: err?.message || 'Server Error' });
      }
    }

    // If not handled method
    res.setHeader('Allow', ['GET', 'POST']);
    return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
  } catch (error: any) {
    console.error(`[ERROR in ${handlerName}]`, error);
    console.error(`[ERROR in ${handlerName}] Stack:`, error.stack);
    return send(res, 500, { success: false, error: `Server Error: ${error?.message || 'Unknown'}` });
  }
}

export default handler;
