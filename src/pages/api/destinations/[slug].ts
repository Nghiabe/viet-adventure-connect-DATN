import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Destination from '@/models/Destination';
import Tour from '@/models/Tour';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req: any & { url?: string }, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
  }

  await dbConnect();

  const url = new URL(req.url || '', 'http://localhost');
  const parts = url.pathname.split('/');
  const slug = parts[parts.indexOf('destinations') + 1];
  if (!slug) return send(res, 400, { success: false, error: 'Invalid slug' });

  // Find destination by slug
  const destination = await Destination.findOne({ slug, status: 'published' }).lean();
  if (!destination) return send(res, 404, { success: false, error: 'Destination not found' });

  // Fetch associated tours (published) with only fields needed for cards
  const associatedTours = await Tour.find({ destination: destination._id, status: 'published' })
    .select({
      title: 1,
      price: 1,
      duration: 1,
      averageRating: 1,
      reviewCount: 1,
      isSustainable: 1,
      mainImage: 1,
      destination: 1,
    })
    .populate({ path: 'destination', select: { name: 1 } })
    .lean();

  return send(res, 200, {
    success: true,
    data: {
      destination: { ...destination, _id: String(destination._id) },
      associatedTours: associatedTours.map((t: any) => ({ ...t, _id: String(t._id) })),
    },
  });
}





