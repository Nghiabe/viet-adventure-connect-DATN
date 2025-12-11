import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Tour from '@/models/Tour';
import Booking from '@/models/Booking';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function handler(req: AuthedRequest, res: ServerResponse) {
  await dbConnect();
  
  const userId = req.user!.userId;

  if (req.method !== 'GET') {
    return send(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const { page = '1', limit = '10', status, tourId, startDate, endDate } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get partner's tour IDs
    const partnerTours = await Tour.find({ owner: userId }).select('_id').lean();
    const tourIds = partnerTours.map(tour => tour._id);

    if (tourIds.length === 0) {
      return send(res, 200, {
        success: true,
        data: {
          bookings: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            pages: 0
          }
        }
      });
    }

    // Build query
    const query: any = { tour: { $in: tourIds } };
    
    if (status) {
      query.status = status;
    }
    
    if (tourId) {
      query.tour = tourId;
    }
    
    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate as string);
      if (endDate) query.bookingDate.$lte = new Date(endDate as string);
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email')
        .populate('tour', 'title price duration')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(query)
    ]);

    return send(res, 200, {
      success: true,
      data: {
        bookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('[Partner Bookings] Error:', error);
    return send(res, 500, { success: false, error: 'Internal Server Error' });
  }
}

export default withRole(['partner'], handler);
