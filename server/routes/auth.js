import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Token generator
const generateToken = (userId, role) => {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, accountType } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ thông tin' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Email đã được sử dụng' });
        }

        // Map accountType to role, allow only 'user' or 'partner' from public registration
        const role = accountType === 'partner' ? 'partner' : 'user';

        // Set status to pending_approval for partners
        const status = role === 'partner' ? 'pending_approval' : 'active';

        const user = await User.create({ name, email, password, role, status });

        // If pending approval, still generate token but frontend will handle redirection
        // if (user.status === 'pending_approval') {
        //     return res.status(201).json({
        //         success: true,
        //         message: 'Đăng ký thành công. Vui lòng chờ phê duyệt đối tác.',
        //         data: {
        //             _id: user._id,
        //             name: user.name,
        //             email: user.email,
        //             role: user.role,
        //             status: user.status
        //         }
        //     });
        // }

        const token = generateToken(user._id, user.role);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                token
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Vui lòng nhập email và mật khẩu' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, error: 'Tài khoản đã bị vô hiệu hóa' });
        }

        // if (user.status === 'pending_approval') {
        //     return res.status(403).json({ success: false, error: 'Tài khoản đang chờ phê duyệt' });
        // }

        const token = generateToken(user._id, user.role);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Đăng xuất thành công' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
