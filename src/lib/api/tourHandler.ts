import type { IncomingMessage, ServerResponse } from 'http';
import dbConnect from '../dbConnect';
import Tour from '../../models/Tour';
import Review from '../../models/Review';

export async function handleGetTourById(
  req: IncomingMessage,
  res: ServerResponse,
  id: string
) {
  try {
    await dbConnect();

    const tour = await Tour.findById(id)
      .populate({ path: 'destination', select: 'name slug' })
      .populate({ path: 'owner', select: 'name avatar' })
      .lean();

    if (!tour) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Tour not found.' }));
    }

    const reviews = await Review.find({ tour: tour._id, status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'user', select: 'name avatar' })
      .lean();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: {
        tour: { ...tour, _id: String(tour._id) },
        reviews: reviews.map((r: any) => ({ ...r, _id: String(r._id) })),
      },
    }));
  } catch (error: any) {
    // Handle invalid ObjectId and other errors uniformly
    const message = error?.message || 'Server Error';
    const isCastError = /Cast to ObjectId failed/.test(message);
    res.statusCode = isCastError ? 400 : 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: isCastError ? 'Invalid tour id.' : `Server Error: ${message}` }));
  }
}





