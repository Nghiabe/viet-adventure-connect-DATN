import type { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'cookie';
import { verifyJwt, JwtPayloadMinimal } from '@/lib/auth/jwt';

export type AuthedRequest = IncomingMessage & { user?: JwtPayloadMinimal };
export type ApiHandler = (req: AuthedRequest, res: ServerResponse) => Promise<void> | void;

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: AuthedRequest, res: ServerResponse) => {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies['auth_token'];
    const payload = token ? verifyJwt(token) : null;

    if (!payload) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
      return;
    }

    req.user = payload;
    return handler(req, res);
  };
}

export function withRole(allowedRoles: Array<'admin' | 'staff' | 'partner' | 'user'>, handler: ApiHandler): ApiHandler {
  return withAuth(async (req, res) => {
    const userRole = req.user?.role as 'admin' | 'staff' | 'partner' | 'user' | undefined;
    if (!userRole || !allowedRoles.includes(userRole)) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Forbidden' }));
      return;
    }
    return handler(req, res);
  });
}





