import type { IncomingMessage, ServerResponse } from 'http';
import { serialize } from 'cookie';

function send(res: ServerResponse, status: number, body: unknown, headers?: Record<string, string>) {
  if (headers) {
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { success: false, error: 'Method Not Allowed' });

  const expiredCookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: -1,
  });

  return send(res, 200, { success: true, data: {} }, { 'Set-Cookie': expiredCookie });
}



