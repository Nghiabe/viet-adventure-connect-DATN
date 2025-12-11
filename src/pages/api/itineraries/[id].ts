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
  const url = new URL(req.url || '', 'http://localhost');
  const id = url.pathname.split('/').pop();
  
  if (!id || !mongoose.isValidObjectId(id)) {
    return send(res, 400, { success: false, error: 'Invalid itinerary id' });
  }

  const userId = (req as any).user?.userId;
  if (!userId) {
    return send(res, 401, { success: false, error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      await dbConnect();
      const itinerary = await Itinerary.findOne({ _id: id, user: userId }).lean();
      if (!itinerary) return send(res, 404, { success: false, error: 'Not found' });

      return send(res, 200, { success: true, data: itinerary });
    } catch (err: any) {
      console.error('[itineraries/:id:GET] Error:', err);
      return send(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      await dbConnect();
      
      // Check ownership
      const existing = await Itinerary.findOne({ _id: id, user: userId });
      if (!existing) {
        return send(res, 404, { success: false, error: 'Not found' });
      }

      let body = '';
      req.on('data', (chunk) => { body += chunk.toString(); });
      await new Promise<void>((resolve) => {
        req.on('end', () => resolve());
      });

      const updates = JSON.parse(body || '{}');
      
      // Remove fields that shouldn't be updated directly
      delete updates._id;
      delete updates.user;
      delete updates.createdAt;

      const updated = await Itinerary.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      return send(res, 200, { success: true, data: updated });
    } catch (err: any) {
      console.error('[itineraries/:id:PATCH] Error:', err);
      return send(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await dbConnect();
      
      // Check ownership
      const existing = await Itinerary.findOne({ _id: id, user: userId });
      if (!existing) {
        return send(res, 404, { success: false, error: 'Not found' });
      }

      // Soft delete: update status to 'archived'
      await Itinerary.findByIdAndUpdate(id, { status: 'archived' });

      return send(res, 200, { success: true });
    } catch (err: any) {
      console.error('[itineraries/:id:DELETE] Error:', err);
      return send(res, 500, { success: false, error: err.message || 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
});






