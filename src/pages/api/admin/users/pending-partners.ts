import type { ServerResponse, IncomingMessage } from 'http';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function handler(req: AuthedRequest, res: ServerResponse) {
  if (req.method !== 'GET') return send(res, 405, { success: false, error: 'Method Not Allowed' });
  await dbConnect();
  const users = await User.find({ status: 'pending_approval' }).select('-password').lean();
  return send(res, 200, { success: true, data: users });
}

export default withRole(['admin', 'staff'], handler);






















































