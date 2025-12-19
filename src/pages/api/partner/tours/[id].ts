import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Tour from '@/models/Tour';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function handler(req: AuthedRequest, res: ServerResponse) {
  await dbConnect();

  const userId = req.user!.userId;
  const tourId = req.url?.split('/').pop();

  if (!tourId) {
    return send(res, 400, { success: false, error: 'Tour ID is required' });
  }

  try {
    // First verify the tour belongs to the partner
    const tour = await Tour.findOne({ _id: tourId, owner: userId });

    if (!tour) {
      return send(res, 404, { success: false, error: 'Tour not found or access denied' });
    }

    if (req.method === 'GET') {
      await tour.populate('destination', 'name slug');
      return send(res, 200, { success: true, data: tour });
    }

    if (req.method === 'PUT') {
      const updateData = { ...req.body };
      delete updateData.owner; // Prevent changing ownership
      delete updateData._id; // Prevent changing ID

      const updatedTour = await Tour.findByIdAndUpdate(
        tourId,
        updateData,
        { new: true, runValidators: true }
      ).populate('destination', 'name slug');

      return send(res, 200, { success: true, data: updatedTour });
    }

    if (req.method === 'DELETE') {
      await Tour.findByIdAndDelete(tourId);
      return send(res, 200, { success: true, message: 'Tour deleted successfully' });
    }

    return send(res, 405, { success: false, error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[Partner Tour Detail] Error:', error);
    return send(res, 500, { success: false, error: 'Internal Server Error' });
  }
}

export default withRole(['partner'], handler);
