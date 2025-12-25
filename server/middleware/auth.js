import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export const requireAuth = (req, res, next) => {
    try {
        console.log(`[Auth Middleware] Processing ${req.method} ${req.url}`);
        console.log('[Auth Middleware] Headers:', JSON.stringify(req.headers, null, 2));

        // 1. Check Authorization header (Bearer token)
        let token = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('[Auth Middleware] Found token in Authorization header');
        }

        // 2. Check cookies if no header
        if (!token && req.headers.cookie) {
            const cookies = parse(req.headers.cookie);
            token = cookies['auth_token'];
            console.log('[Auth Middleware] Cookie string:', req.headers.cookie);
            console.log('[Auth Middleware] Cookies parsed keys:', Object.keys(cookies));
            if (token) console.log('[Auth Middleware] Found token in cookie: auth_token');
        }

        if (!token) {
            console.warn('[Auth Middleware] No token found in header or cookie');
            return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
        }

        // 3. Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log('[Auth Middleware] Token verified for user:', decoded.userId);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
};
