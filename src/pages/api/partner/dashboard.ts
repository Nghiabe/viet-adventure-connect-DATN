import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Tour from '@/models/Tour';
import Booking from '@/models/Booking';
import Review from '@/models/Review';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function handler(req: AuthedRequest, res: ServerResponse) {
  await dbConnect();
  
  if (req.method !== 'GET') {
    return send(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const userId = req.user!.userId;
    
    // Get partner's tours
    const partnerTours = await Tour.find({ owner: userId }).select('_id title price status').lean();
    const tourIds = partnerTours.map(tour => tour._id);
    
    // Calculate KPIs
    const [
      totalTours,
      publishedTours,
      totalBookings,
      confirmedBookings,
      totalRevenue,
      averageRating,
      totalReviews
    ] = await Promise.all([
      // Total tours count
      Tour.countDocuments({ owner: userId }),
      
      // Published tours count
      Tour.countDocuments({ owner: userId, status: 'published' }),
      
      // Total bookings count
      Booking.countDocuments({ tour: { $in: tourIds } }),
      
      // Confirmed bookings count
      Booking.countDocuments({ tour: { $in: tourIds }, status: 'confirmed' }),
      
      // Total revenue from confirmed bookings
      Booking.aggregate([
        { $match: { tour: { $in: tourIds }, status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]).then(result => result[0]?.total || 0),
      
      // Average rating across all partner's tours
      Review.aggregate([
        { $match: { tour: { $in: tourIds }, status: 'approved' } },
        { $group: { _id: null, average: { $avg: '$rating' } } }
      ]).then(result => result[0]?.average || 0),
      
      // Total reviews count
      Review.countDocuments({ tour: { $in: tourIds }, status: 'approved' })
    ]);

    // Recent bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = await Booking.find({
      tour: { $in: tourIds },
      createdAt: { $gte: thirtyDaysAgo }
    })
    .populate('user', 'name email')
    .populate('tour', 'title')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          tour: { $in: tourIds },
          status: 'confirmed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const dashboardData = {
      kpis: {
        totalTours,
        publishedTours,
        totalBookings,
        confirmedBookings,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews
      },
      recentBookings,
      monthlyRevenue,
      tours: partnerTours
    };

    return send(res, 200, { success: true, data: dashboardData });
  } catch (error) {
    console.error('[Partner Dashboard API] Error:', error);
    return send(res, 500, { success: false, error: 'Internal Server Error' });
  }
}

export default withRole(['partner'], handler);
