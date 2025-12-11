import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';
import Booking from '@/models/Booking';
import User from '@/models/User';
import Review from '@/models/Review';
import Tour from '@/models/Tour';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default withRole(['admin', 'staff'], async function handler(req: AuthedRequest, res: ServerResponse) {
  if (req.method !== 'GET') return send(res, 405, { success: false, error: 'Method Not Allowed' });
  await dbConnect();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const pipelineRevenueByMonth = [
    { $match: { status: 'confirmed' } },
    { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ];

  // Parallel queries for performance
  const [
    revenueAgg,
    monthRevenue,
    prevMonthRevenue,
    newUsersCount,
    newBookingsCount,
    pendingReviewsCount,
    topTours,
    recentBookings
  ] = await Promise.all([
    Booking.aggregate(pipelineRevenueByMonth),
    Booking.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, sum: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
      { $group: { _id: null, sum: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Review.countDocuments({}),
    Booking.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$tour', revenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'tours', localField: '_id', foreignField: '_id', as: 'tour' } },
      { $unwind: '$tour' },
      { $project: { _id: 0, tourId: '$tour._id', title: '$tour.title', revenue: 1, count: 1 } },
    ]),
    Booking.find({}).sort({ createdAt: -1 }).limit(10).populate('user', 'name').populate('tour', 'title').lean(),
  ]);

  const currSum = monthRevenue[0]?.sum || 0;
  const prevSum = prevMonthRevenue[0]?.sum || 0;
  const revenueDelta = prevSum === 0 ? 100 : Math.round(((currSum - prevSum) / prevSum) * 100);

  const chart = revenueAgg.map((r: any) => ({
    month: `${r._id.m}/${r._id.y}`,
    revenue: r.revenue,
    bookings: r.bookings,
  }));

  const response = {
    success: true,
    data: {
      vitals: {
        monthlyRevenue: { value: currSum, comparisonPct: revenueDelta },
        newBookings: newBookingsCount,
        newUsers: newUsersCount,
        conversionRate: null, // Placeholder until sessions metric exists
        pendingReviews: pendingReviewsCount,
      },
      trends: {
        combined: chart,
        topTours,
      },
      activity: {
        recentBookings: recentBookings.map((b: any) => ({
          id: String(b._id),
          user: b.user?.name || 'N/A',
          tour: b.tour?.title || 'N/A',
          total: b.totalPrice,
          status: b.status,
          createdAt: b.createdAt,
        })),
        // Additional live activity streams can be appended here
      },
    },
  };

  return send(res, 200, response);
});



