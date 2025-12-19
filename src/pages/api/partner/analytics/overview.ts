
import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
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

    if (req.method !== 'GET') {
        return send(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        // 1. Get all tour IDs owned by this partner
        const partnerTours = await Tour.find({ owner: userId }).select('_id').lean();
        const tourIds = partnerTours.map(t => t._id);

        // If no tours, return empty stats
        if (tourIds.length === 0) {
            return send(res, 200, { success: true, data: { revAgg: [], kpis: [{ revenue: 0, bookings: 0 }, 0] } });
        }

        // Parse filters (e.g., this month)
        // For simplicity, default to current month/year logic or mock "all time" for overview
        // Admin uses 'startDate' and 'endDate' query
        const host = req.headers.host || 'localhost';
        const url = new URL(req.url!, `http://${host}`);
        const startStr = url.searchParams.get('startDate');
        const endStr = url.searchParams.get('endDate');

        const startDate = startStr ? new Date(startStr) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const endDate = endStr ? new Date(endStr) : new Date();

        const dateFilter = {
            createdAt: { $gte: startDate, $lte: endDate }
        };

        // 2. Aggregate Revenue & Bookings
        // Match Bookings for Partner's Tours AND Date Range
        const matchStage = {
            tour: { $in: tourIds },
            status: 'confirmed', // Only count confirmed for revenue?
            ...dateFilter
        };

        const revAgg = await Booking.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: '$createdAt' },
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    revenue: { $sum: '$totalPrice' },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            // Format _id for chart
            {
                $project: {
                    _id: { $concat: [{ $toString: '$_id.day' }, '/', { $toString: '$_id.month' }] },
                    revenue: 1,
                    bookings: 1
                }
            }
        ]);

        // KPI: Total Revenue & Bookings in Range
        const kpiStats = await Booking.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$totalPrice' },
                    bookings: { $sum: 1 }
                }
            }
        ]);
        const totalStats = kpiStats[0] || { revenue: 0, bookings: 0 };

        // KPI: New Users (Customers who booked partner's tours for the first time?)
        // This is hard to calculate efficiently. Admin one counts NEW USER REGISTRATIONS.
        // Partner cares about "Customers".
        // Let's count "Unique Customers" in this period?
        const uniqueCustomers = await Booking.distinct('user', matchStage);
        const newCustomersCount = uniqueCustomers.length; // Approximate "Active Customers"

        return send(res, 200, {
            success: true,
            data: {
                revAgg,
                kpis: [totalStats, newCustomersCount]
            }
        });

    } catch (error) {
        console.error('[Partner Analytics Overview] Error:', error);
        return send(res, 500, { success: false, error: 'Internal Server Error' });
    }
}

export default withRole(['partner'], handler);
