import type { ServerResponse } from 'http';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function handler(req: AuthedRequest, res: ServerResponse) {
  if (req.method === 'GET') {
    // Redirect to the main tours endpoint for consistency
    res.statusCode = 301;
    res.setHeader('Location', '/api/admin/tours/');
    res.end();
    return;
  }
  return send(res, 405, { success: false, error: 'Method Not Allowed' });
}

export default withRole(['admin'], handler);

















