import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
    try {
        // console.log(`[Auth Middleware] Processing ${req.method} ${req.url}`);
        // console.log('[Auth Middleware] Headers:', JSON.stringify(req.headers, null, 2));

        // 1. Check Authorization header (Bearer token)
        let token = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
            // console.log('[Auth Middleware] Found token in Authorization header');
        }

        // 2. Check cookies if no header
        if (!token && req.headers.cookie) {
            const cookies = parse(req.headers.cookie);
            token = cookies['auth_token'];
            // console.log('[Auth Middleware] Cookie string:', req.headers.cookie);
            // console.log('[Auth Middleware] Cookies parsed keys:', Object.keys(cookies));
            if (token) {
                // console.log('[Auth Middleware] Found token in cookie: auth_token');
            }
        }

        if (!token) {
            // console.warn('[Auth Middleware] No token found in header or cookie');
            return res.status(401).json({ success: false, error: 'Không có quyền truy cập: Chưa đăng nhập' });
        }

        // 3. Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // 4. Check user status in DB
        const user = await User.findById(decoded.userId).select('role status');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Không có quyền truy cập: Không tìm thấy người dùng' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, error: 'Tài khoản đã bị vô hiệu hóa' });
        }

        // Allow pending_approval to login (restricted access implemented in specific routes)
        // if (user.status === 'pending_approval') {
        //    return res.status(403).json({ success: false, error: 'Tài khoản đang chờ phê duyệt' });
        // }

        req.user = { userId: user._id, role: user.role, status: user.status };
        // console.log('[Auth Middleware] Token verified for user:', decoded.userId);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({ success: false, error: 'Không có quyền truy cập: Phiên đăng nhập không hợp lệ' });
    }
};

export const requireAdmin = (req, res, next) => {
    requireAuth(req, res, () => {
        if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
            next();
        } else {
            return res.status(403).json({ success: false, error: 'Truy cập bị từ chối: Yêu cầu quyền quản trị viên' });
        }
    });
};

export const requireApprovedPartner = (req, res, next) => {
    requireAuth(req, res, () => {
        if (req.user && req.user.role === 'partner' && req.user.status === 'active') {
            next();
        } else {
            // Customize error message based on status
            if (req.user && req.user.role === 'partner' && req.user.status === 'pending_approval') {
                return res.status(403).json({ success: false, error: 'Tài khoản đối tác đang chờ phê duyệt. Vui lòng quay lại sau.' });
            }
            return res.status(403).json({ success: false, error: 'Truy cập bị từ chối: Yêu cầu tài khoản đối tác đã được duyệt' });
        }
    });
};
