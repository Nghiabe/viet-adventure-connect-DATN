import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Tour from '@/models/Tour';
import Destination from '@/models/Destination';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function handler(req: AuthedRequest, res: ServerResponse) {
  await dbConnect();
  
  const userId = req.user!.userId;

  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '10', status, search } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query: any = { owner: userId };
      
      if (status) {
        query.status = status;
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const [tours, total] = await Promise.all([
        Tour.find(query)
          .populate('destination', 'name slug')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Tour.countDocuments(query)
      ]);

      return send(res, 200, {
        success: true,
        data: {
          tours,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('[Partner Tours GET] Error:', error);
      return send(res, 500, { success: false, error: 'Internal Server Error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const tourData = {
        ...req.body,
        owner: userId,
        status: 'draft' // New tours start as draft
      };

      const tour = new Tour(tourData);
      await tour.save();
      
      await tour.populate('destination', 'name slug');

      return send(res, 201, { success: true, data: tour });
    } catch (error) {
      console.error('[Partner Tours POST] Error:', error);
      return send(res, 500, { success: false, error: 'Internal Server Error' });
    }
  }

  return send(res, 405, { success: false, error: 'Method Not Allowed' });
}

export default withRole(['partner'], handler);