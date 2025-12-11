import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';
import Tour from '@/models/Tour';
import mongoose from 'mongoose';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default withRole(['admin', 'staff'], async function handler(req: AuthedRequest & { url?: string }, res: ServerResponse) {
  try {
    await dbConnect();

    const url = new URL(req.url || '', 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);
    const toursIndex = parts.indexOf('tours');
    const id = toursIndex >= 0 ? parts[toursIndex + 1] : undefined;

    if (!id || !mongoose.isValidObjectId(id)) {
      return send(res, 400, { success: false, error: 'Invalid id' });
    }

    if (req.method === 'PUT') {
      // parse body
      let body = '';
      await new Promise<void>((resolve) => {
        req.on('data', (c: any) => (body += c.toString()));
        req.on('end', () => resolve());
      });

      let payload: any;
      try {
        payload = body ? JSON.parse(body) : {};
      } catch (err) {
        return send(res, 400, { success: false, error: 'Invalid JSON body' });
      }

      // If frontend sends `destinations` but model doesn't support it,
      // fallback to legacy `destination` using first destinations[0].destinationId
      const hasDestinationsPath = !!(Tour.schema.path('destinations'));
      if (!hasDestinationsPath && Array.isArray(payload.destinations) && payload.destinations.length > 0) {
        const first = payload.destinations.find((d: any) => d?.destinationId || d?.id);
        const firstId = first ? (first.destinationId || first.id) : undefined;
        if (firstId && mongoose.isValidObjectId(firstId)) {
          payload.destination = firstId;
        }
        // remove destinations so update won't include unknown key
        delete payload.destinations;
      }

      // Prevent accidentally setting empty strings to ObjectId fields
      if (payload.owner === '') delete payload.owner;
      if (payload.destination === '') delete payload.destination;

      // Run update
      const updated = await Tour.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).exec();
      if (!updated) return send(res, 404, { success: false, error: 'Tour not found' });

      // Populate common relations: owner and destination
      let query = Tour.findById(updated._id);
      query = query.populate('owner', 'name email'); // adjust fields as needed
      query = query.populate('destination', 'name slug mainImage');

      // If schema includes destinations.destinationId, populate it safely
      if (hasDestinationsPath) {
        try {
          // try populate nested destinationId if schema supports it
          query = (query as any).populate('destinations.destinationId', 'name slug');
        } catch (e) {
          // If populate fails (strictPopulate), ignore and proceed
          console.warn('Could not populate destinations.destinationId:', e);
        }
      }

      const populated = await query.lean().exec();

      return send(res, 200, { success: true, data: populated });
    }

    if (req.method === 'DELETE') {
      await Tour.findByIdAndDelete(id).exec();
      return send(res, 200, { success: true });
    }

    // Method not allowed
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return send(res, 405, { success: false, error: 'Method Not Allowed' });
  } catch (err: any) {
    console.error('[api/admin/tours/[id]] Error:', err);
    return send(res, 500, { success: false, error: err?.message || 'Server error' });
  }
});
