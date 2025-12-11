import type { IncomingMessage, ServerResponse } from 'http';
import dbConnect from '../dbConnect';
import Destination from '../../models/Destination';
import Tour from '../../models/Tour';
import Story from '../../models/Story';

export async function handleGetDestinationBySlug(
  req: IncomingMessage,
  res: ServerResponse,
  slug: string
) {
  try {
    await dbConnect();

    const destination = await Destination.findOne({ slug, status: 'published' }).lean();
    if (!destination) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Destination not found.' }));
    }

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

    // Fetch a few top community stories associated with this destination
    const associatedStories = await Story.find({ destination: destination._id, status: 'approved' })
      .select({
        title: 1,
        coverImage: 1,
        tags: 1,
        likeCount: 1,
        createdAt: 1,
        author: 1,
      })
      .populate({ path: 'author', select: { name: 1, avatar: 1 } })
      .sort({ likeCount: -1, createdAt: -1 })
      .limit(3)
      .lean();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: {
        destination: { ...destination, _id: String(destination._id) },
        associatedTours: associatedTours.map((t: any) => ({ ...t, _id: String(t._id) })),
        associatedStories: associatedStories.map((s: any) => ({
          _id: String(s._id),
          title: s.title,
          coverImage: s.coverImage,
          tags: s.tags || [],
          likeCount: s.likeCount || 0,
          createdAt: s.createdAt,
          author: s.author ? { name: s.author.name, avatar: (s.author as any).avatar } : undefined,
        })),
      },
    }));
  } catch (error: any) {
    console.error(`[API Handler Error] /api/destinations/${slug}:`, error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: `Server Error: ${error.message}` }));
  }
}


