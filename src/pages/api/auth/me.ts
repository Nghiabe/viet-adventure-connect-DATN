import type { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'cookie';
import dbConnect from '@/lib/dbConnect';
import { verifyJwt } from '@/lib/auth/jwt';
import User from '@/models/User';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') return send(res, 405, { success: false, error: 'Method Not Allowed' });

  const cookies = parse(req.headers.cookie || '');
  const token = cookies['auth_token'];
  if (!token) return send(res, 401, { success: false, error: 'Unauthorized' });

  const payload = verifyJwt(token);
  if (!payload) return send(res, 401, { success: false, error: 'Unauthorized' });

  try {
    await dbConnect();
    const user = await User.findById(payload.userId);
    if (!user) return send(res, 404, { success: false, error: 'User not found' });

    const { password: _p, ...safe } = user.toObject();
    return send(res, 200, { success: true, data: safe });
  } catch (err: any) {
    return send(res, 500, { success: false, error: err.message || 'Server error' });
  }
}





