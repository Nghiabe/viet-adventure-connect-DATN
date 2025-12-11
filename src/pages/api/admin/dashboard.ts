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

  // Parse query parameters for date range
  const { from, to } = req.query as { from?: string; to?: string };
  
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

    return send(res, 200, response);

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return send(res, 500, { 
      success: false, 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
