import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function handler(req: AuthedRequest & { url?: string }, res: ServerResponse) {
  if (req.method !== 'PUT') return send(res, 405, { success: false, error: 'Method Not Allowed' });
  const url = new URL(req.url || '', 'http://localhost');
  const parts = url.pathname.split('/');
  const userId = parts[parts.indexOf('users') + 1];
  if (!userId) return send(res, 400, { success: false, error: 'Invalid user id' });
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) return send(res, 404, { success: false, error: 'User not found' });
  user.role = 'partner';
  user.status = 'active';
  await user.save();
  const safe = user.toObject(); delete (safe as any).password;
  return send(res, 200, { success: true, data: safe });
}

export default withRole(['admin', 'staff'], handler);






















































