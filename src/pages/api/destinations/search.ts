import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Destination from '@/models/Destination';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    await dbConnect();

    const { q: query, limit = '10' } = req.query || {};
    const limitNum = Math.min(parseInt(limit as string) || 10, 20); // Max 20 results

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return send(res, 400, { 
        success: false, 
        error: 'Query parameter is required' 
      });
    }

    const searchQuery = query.trim();
    
    // Search destinations by name, description, or location
    const destinations = await Destination.find({
      $and: [
        { status: 'published' }, // Only published destinations
        {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } },
            { location: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name slug location image')
    .limit(limitNum)
    .lean();

    return send(res, 200, { 
      success: true, 
      data: destinations,
      total: destinations.length
    });

  } catch (error: any) {
    console.error('Search destinations error:', error);
    return send(res, 500, { 
      success: false, 
      error: 'Lỗi server, vui lòng thử lại sau' 
    });
  }
}













