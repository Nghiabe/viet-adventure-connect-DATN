import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Tour from '@/models/Tour';
import Review from '@/models/Review';
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
    const { page = '1', limit = '10', status, tourId, rating } = req.query;
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
          reviews: [],
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
    
    if (rating) {
      query.rating = parseInt(rating as string);
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name email avatar')
        .populate('tour', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query)
    ]);

    // Calculate rating statistics
    const ratingStats = await Review.aggregate([
      { $match: { tour: { $in: tourIds }, status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: {
              $switch: {
                branches: [
                  { case: { $eq: ['$rating', 5] }, then: 'five' },
                  { case: { $eq: ['$rating', 4] }, then: 'four' },
                  { case: { $eq: ['$rating', 3] }, then: 'three' },
                  { case: { $eq: ['$rating', 2] }, then: 'two' },
                  { case: { $eq: ['$rating', 1] }, then: 'one' }
                ],
                default: 'other'
              }
            }
          }
        }
      }
    ]);

    const stats = ratingStats[0] || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: []
    };

    // Count rating distribution
    const distribution = {
      five: stats.ratingDistribution.filter((r: string) => r === 'five').length,
      four: stats.ratingDistribution.filter((r: string) => r === 'four').length,
      three: stats.ratingDistribution.filter((r: string) => r === 'three').length,
      two: stats.ratingDistribution.filter((r: string) => r === 'two').length,
      one: stats.ratingDistribution.filter((r: string) => r === 'one').length
    };

    return send(res, 200, {
      success: true,
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        stats: {
          averageRating: Math.round(stats.averageRating * 10) / 10,
          totalReviews: stats.totalReviews,
          distribution
        }
      }
    });
  } catch (error) {
    console.error('[Partner Reviews] Error:', error);
    return send(res, 500, { success: false, error: 'Internal Server Error' });
  }
}

export default withRole(['partner'], handler);
