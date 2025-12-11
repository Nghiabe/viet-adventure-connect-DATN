import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';
import Review from '@/models/Review';
import mongoose from 'mongoose';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default withRole(['admin', 'staff'], async function handler(req: AuthedRequest & { url?: string }, res: ServerResponse) {
  if (req.method !== 'GET') return send(res, 405, { success: false, error: 'Method Not Allowed' });
  await dbConnect();
  const url = new URL(req.url || '', 'http://localhost');
  const parts = url.pathname.split('/');
  const id = parts[parts.indexOf('tours') + 1];
  const docs = await Review.find({ tour: new mongoose.Types.ObjectId(id) }).populate('user', 'name').lean();
  return send(res, 200, { success: true, data: docs });
});

















