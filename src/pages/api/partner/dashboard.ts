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
    // Extract filters
    // Manually parse query parameters from the URL since req.query might not be populated in this raw handler context depending on the framework version, 
    // but assuming standard Next.js API route behavior or our custom server setup:
    // If using raw node http:
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url!, `http://${host}`);
    const range = url.searchParams.get('range') || '30d'; // 7d, 30d, 1y, all
    const search = url.searchParams.get('search') || '';

    // Calculate Date Range
    let startDate: Date | null = null;
    const now = new Date();
    if (range === '7d') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (range === '30d') {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else if (range === '1y') {
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }
    // If 'all', startDate remains null

    // Base filters
    const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    // Get partner's tours (filtered by search if provided)
    const tourQuery: any = { owner: userId };
    if (search) {
      // Escape regex special characters
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      tourQuery.title = { $regex: escapedSearch, $options: 'i' };
    }
    // Note: If we search for tours, we still need ALL tour IDs to filter bookings correctly for KPIs?
    // Actually, usually dashboard search filters the *entire* dashboard context. 
    // So if I search "Ha Long", I expect KPIs to show stats ONLY for "Ha Long".
    // Let's implement that: First find matching tours, then use those IDs for bookings.

    const partnerTours = await Tour.find(tourQuery).select('_id title price status').lean();
    const tourIds = partnerTours.map(tour => tour._id);

    // If search matched nothing, we might want to return empty immediately or just proceeding with empty ID list will yield 0s naturally.

    // KPI Filters: Must match Tours found AND Date Range
    const bookingMatch: any = { tour: { $in: tourIds }, ...dateFilter };
    const confirmedMatch: any = { tour: { $in: tourIds }, status: 'confirmed', ...dateFilter };
    const reviewMatch: any = { tour: { $in: tourIds }, status: 'approved', ...dateFilter };

    // Calculate KPIs
    const [
      totalTours,
      publishedTours, // Note: "Published tours" KPI might ignore date range (it's current state) but respect Search
      totalBookings,
      confirmedBookings,
      totalRevenue,
      averageRating,
      totalReviews
    ] = await Promise.all([
      // Total tours count (Matches search)
      Tour.countDocuments(tourQuery),

      // Published tours count (Matches search)
      Tour.countDocuments({ ...tourQuery, status: 'published' }),

      // Total bookings count (Matches Search + Date)
      Booking.countDocuments(bookingMatch),

      // Confirmed bookings count (Matches Search + Date)
      Booking.countDocuments(confirmedMatch),

      // Total revenue from confirmed bookings (Matches Search + Date)
      Booking.aggregate([
        { $match: confirmedMatch },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]).then(result => result[0]?.total || 0),

      // Average rating (Matches Search + Date)
      Review.aggregate([
        { $match: reviewMatch },
        { $group: { _id: null, average: { $avg: '$rating' } } }
      ]).then(result => result[0]?.average || 0),

      // Total reviews count (Matches Search + Date)
      Review.countDocuments(reviewMatch)
    ]);

    // Recent bookings (Matches Search + Date)
    // We can use the same dateFilter. If range is 'all', limit to maybe 30 for safety or just pagination (top 10 here)
    const recentBookings = await Booking.find(bookingMatch)
      .populate('user', 'name email')
      .populate('tour', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Revenue by month 
    // Usually a chart shows a fixed range (e.g. 6 months). 
    // If user selects '7d', a monthly chart is useless. If '1y', it's good.
    // Let's adjust chart range based on filter:
    // If range is 7d -> Show daily for last 7 days? Or just skip? 
    // The current UI expects "Monthly Revenue". Let's simply respect the filter for the aggregation,
    // but we might need group by day if range is small. 
    // For simplicity/stability, let's keep it Monthly but respect the start date. 
    // If range is 30d, it will show this month and maybe last.

    // NOTE: Current frontend expects `monthlyRevenue` with `year/month`.
    // Let's stick to the selected startDate or default 6 months if startDate is too recent?
    // User asked for "7 days, 30 days, 1 year".
    // 7 days -> grouping by day would be better, but frontend expects year/month? 
    // Let's check frontend. `PartnerDashboard.tsx` checks `monthlyRevenue.length > 0` and loops.
    // It formats sum. It doesn't seem to render a chart yet (placeholder).
    // So ensuring we return correct data structure is enough.

    const revenueStartDate = startDate || new Date(new Date().setMonth(new Date().getMonth() - 12)); // Default to 1y for charts if 'all'

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          tour: { $in: tourIds },
          status: 'confirmed',
          createdAt: { $gte: revenueStartDate }
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
      tours: partnerTours // This list is filtered by search title
    };

    return send(res, 200, { success: true, data: dashboardData });
  } catch (error) {
    console.error('[Partner Dashboard API] Error:', error);
    return send(res, 500, { success: false, error: 'Internal Server Error' });
  }
}

export default withRole(['partner'], handler);
