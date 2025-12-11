import type { IncomingMessage, ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Itinerary from '@/models/Itinerary';
import { withAuth, type AuthedRequest } from '@/lib/auth/withAuth';
import mongoose from 'mongoose';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default withAuth(async function handler(req: AuthedRequest & IncomingMessage, res: ServerResponse) {
  if (req.method === 'POST') {
    // Create itinerary
    try {
      await dbConnect();
      const userId = (req as any).user?.userId;
      if (!userId) {
        return send(res, 401, { success: false, error: 'Unauthorized' });
      }

      let body = '';
      req.on('data', (chunk) => { body += chunk.toString(); });
      await new Promise<void>((resolve) => {
        req.on('end', () => resolve());
      });

      const data = JSON.parse(body || '{}');
      
      // Validate required fields
      if (!data.name) {
        return send(res, 400, { success: false, error: 'Missing required field: name' });
      }

      // Create itinerary
      const itinerary = await Itinerary.create({
        user: userId,
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status || 'draft',
        generationParams: data.generationParams,
        dailyPlan: data.dailyPlan,
        hotels: data.hotels,
        transportation: data.transportation,
        mapData: data.mapData,
        totalCost: data.totalCost,
        importantNotes: data.importantNotes,
        aiPlan: data.aiPlan, // Keep for backward compatibility
        schedule: data.schedule
      });

      return send(res, 201, {
        success: true,
        data: {
          _id: String(itinerary._id),
          ...itinerary.toObject()
        }
      });
    } catch (err: any) {
      console.error('[itineraries:POST] Error:', err);
      return send(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  if (req.method === 'GET') {
    // List user's itineraries
    try {
      await dbConnect();
      const userId = (req as any).user?.userId;
      if (!userId) {
        return send(res, 401, { success: false, error: 'Unauthorized' });
      }

      const url = new URL(req.url || '', 'http://localhost');
      const status = url.searchParams.get('status');
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      const match: any = { user: new mongoose.Types.ObjectId(userId) };
      if (status) {
        match.status = status;
      }

      const [itineraries, total] = await Promise.all([
        Itinerary.find(match)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Itinerary.countDocuments(match)
      ]);

      return send(res, 200, {
        success: true,
        data: {
          itineraries,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (err: any) {
      console.error('[itineraries:GET] Error:', err);
      return send(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
});



