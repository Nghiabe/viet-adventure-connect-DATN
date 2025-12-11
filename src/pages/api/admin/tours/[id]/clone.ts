import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';
import Tour from '@/models/Tour';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default withRole(['admin', 'staff'], async function handler(req: AuthedRequest & { url?: string }, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { success: false, error: 'Method Not Allowed' });
  await dbConnect();
  const url = new URL(req.url || '', 'http://localhost');
  const parts = url.pathname.split('/');
  const id = parts[parts.indexOf('tours') + 1];
  const tour = await Tour.findById(id).lean();
  if (!tour) return send(res, 404, { success: false, error: 'Not found' });
  const { _id, createdAt, updatedAt, ...rest } = tour as any;
  const cloned = await Tour.create({ ...rest, title: `${rest.title} (Copy)`, status: 'draft' });
  return send(res, 201, { success: true, data: cloned });
});

















