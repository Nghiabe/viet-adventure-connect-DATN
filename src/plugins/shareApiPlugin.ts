import { type ViteDevServer } from 'vite';
import { verifyJwt } from '../lib/auth/jwt';
import dbConnect from '../lib/dbConnect';
import User from '../models/User';
import Itinerary from '../models/Itinerary';
import Notification from '../models/Notification';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ketnghia10a5g@gmail.com', // Assuming this is the sender email based on the screenshot/request context or hardcoded for now
        pass: 'ckvn swqd xeks ismu' // User provided app password
    }
});

export function shareApiPlugin() {
    return {
        name: 'vite-plugin-share-api',
        configureServer(server: ViteDevServer) {
            server.middlewares.use(async (req: any, res: any, next: any) => {
                const url = req.originalUrl || req.url || '';

                // --- GET /api/users/search?q=... ---
                if (req.method === 'GET' && url.startsWith('/api/users/search')) {
                    try {
                        // 1. Auth check
                        const { parse } = await import('cookie');
                        const cookies = parse(req.headers.cookie || '');
                        const token = cookies['auth_token'];
                        const payload = token ? verifyJwt(token) : null;

                        if (!payload || !payload.userId) {
                            res.statusCode = 401;
                            res.setHeader('Content-Type', 'application/json');
                            return res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
                        }

                        // 2. Parse query
                        const urlObj = new URL(url, `http://${req.headers.host}`);
                        const query = urlObj.searchParams.get('q')?.trim() || '';

                        if (query.length < 2) {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            return res.end(JSON.stringify({ success: true, data: [] }));
                        }

                        await dbConnect();

                        // 3. Search Users
                        const users = await User.find({
                            _id: { $ne: payload.userId },
                            $or: [
                                { name: { $regex: query, $options: 'i' } },
                                { email: { $regex: query, $options: 'i' } }
                            ]
                        })
                            .select('_id name email avatar')
                            .limit(10)
                            .lean();

                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: true, data: users }));

                    } catch (err: any) {
                        console.error('[Share API] Search error:', err);
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
                    }
                }

                // --- POST /api/plans/invite ---
                if (req.method === 'POST' && url === '/api/plans/invite') {
                    try {
                        // 1. Auth check
                        const { parse } = await import('cookie');
                        const cookies = parse(req.headers.cookie || '');
                        const token = cookies['auth_token'];
                        const payload = token ? verifyJwt(token) : null;

                        if (!payload || !payload.userId) {
                            res.statusCode = 401;
                            res.setHeader('Content-Type', 'application/json');
                            return res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
                        }

                        // 2. Parse Body
                        const body = await new Promise<any>((resolve, reject) => {
                            let b = '';
                            req.on('data', (c: any) => b += c);
                            req.on('end', () => {
                                try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); }
                            });
                            req.on('error', reject);
                        });

                        const { planId, emails, userIds, permission } = body;

                        if (!planId) {
                            res.statusCode = 400;
                            res.setHeader('Content-Type', 'application/json');
                            return res.end(JSON.stringify({ success: false, error: 'Missing planId' }));
                        }

                        // Validate ObjectId format
                        if (!/^[0-9a-fA-F]{24}$/.test(planId)) {
                            res.statusCode = 400;
                            res.setHeader('Content-Type', 'application/json');
                            return res.end(JSON.stringify({ success: false, error: 'Invalid planId format' }));
                        }

                        console.log('[Share API] Processing invite for plan:', planId);

                        await dbConnect();
                        const sender = await User.findById(payload.userId).lean();
                        const plan = await Itinerary.findById(planId);

                        if (!plan) {
                            res.statusCode = 404;
                            res.setHeader('Content-Type', 'application/json');
                            return res.end(JSON.stringify({ success: false, error: 'Kế hoạch không tồn tại' }));
                        }

                        // Fix validation error if user is missing (legacy/bad data)
                        if (!plan.user) {
                            plan.user = payload.userId;
                        }

                        // 3. Process User Invites (In-App)
                        if (userIds && Array.isArray(userIds)) {
                            for (const recipientId of userIds) {
                                // Skip if self
                                if (recipientId === payload.userId) continue;

                                const token = crypto.randomBytes(32).toString('hex');

                                // Add to Pending Invites
                                plan.pendingInvites = plan.pendingInvites || [];
                                // Check if already pending? (Optional optimization)
                                plan.pendingInvites.push({
                                    token,
                                    permission: permission || 'view',
                                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                                });

                                // Create Notification
                                await Notification.create({
                                    recipient: recipientId,
                                    type: 'invite',
                                    message: `${sender?.name || 'Ai đó'} đã mời bạn tham gia kế hoạch "${plan?.name}"`,
                                    link: `/my-plans?inviteId=${token}&planId=${planId}`,
                                    isRead: false
                                });
                            }
                        }

                        // 4. Process Email Invites
                        if (emails && Array.isArray(emails)) {
                            for (const email of emails) {
                                const token = crypto.randomBytes(32).toString('hex');
                                plan.pendingInvites = plan.pendingInvites || [];
                                plan.pendingInvites.push({
                                    email,
                                    token,
                                    permission: permission || 'view',
                                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                });

                                const inviteLink = `http://localhost:5173/my-plans?inviteId=${token}&planId=${planId}`;

                                try {
                                    await transporter.sendMail({
                                        from: '"VietAdventure Connect" <ketnghia10a5g@gmail.com>',
                                        to: email,
                                        subject: `Lời mời tham gia kế hoạch: ${plan?.name}`,
                                        html: `
                                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                                <h2 style="color: #2563eb;">Lời mời tham gia chuyến đi!</h2>
                                                <p>Xin chào,</p>
                                                <p><strong>${sender?.name}</strong> đã mời bạn tham gia lên kế hoạch cho chuyến đi <strong>"${plan?.name}"</strong>.</p>
                                                <div style="margin: 30px 0;">
                                                    <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                                        Xem kế hoạch ngay
                                                    </a>
                                                </div>
                                                <p style="color: #666; font-size: 14px;">Hoặc copy link này: ${inviteLink}</p>
                                            </div>
                                        `
                                    });
                                } catch (emailErr) {
                                    console.error('[Share API] Failed to send email to', email, emailErr);
                                    // Continue even if email fails
                                }
                            }
                        }

                        await plan.save();

                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: true, message: 'Invites sent' }));

                    } catch (err: any) {
                        console.error('[Share API] Invite error:', err);
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({
                            success: false,
                            error: err.message || 'Internal Server Error',
                            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
                        }));
                    }
                }

                // --- POST /api/invitations/accept ---
                if (req.method === 'POST' && url === '/api/invitations/accept') {
                    try {
                        const { parse } = await import('cookie');
                        const cookies = parse(req.headers.cookie || '');
                        const tokenStr = cookies['auth_token'];
                        const payload = tokenStr ? verifyJwt(tokenStr) : null;

                        if (!payload || !payload.userId) {
                            res.statusCode = 401;
                            res.setHeader('Content-Type', 'application/json');
                            return res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
                        }

                        const body = await new Promise<any>((resolve, reject) => {
                            let b = '';
                            req.on('data', (c: any) => b += c);
                            req.on('end', () => {
                                try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); }
                            });
                            req.on('error', reject);
                        });

                        const { token, planId } = body;

                        await dbConnect();
                        const plan = await Itinerary.findById(planId);

                        if (!plan) {
                            res.statusCode = 404;
                            return res.end(JSON.stringify({ success: false, error: 'Plan not found' }));
                        }

                        // Find Invite
                        const inviteIndex = plan.pendingInvites?.findIndex((p: any) => p.token === token);

                        if (inviteIndex === undefined || inviteIndex === -1) {
                            res.statusCode = 400;
                            return res.end(JSON.stringify({ success: false, error: 'Invalid or expired invitation' }));
                        }

                        const invite = plan.pendingInvites![inviteIndex];

                        // Move to sharedWith
                        if (!plan.sharedWith) plan.sharedWith = [];

                        // Check if already in sharedWith
                        const alreadyShared = plan.sharedWith.some((s: any) => s.user.toString() === payload.userId);
                        if (!alreadyShared) {
                            plan.sharedWith.push({
                                user: payload.userId as any,
                                permission: invite.permission
                            });
                        }

                        // Remove pending invite
                        plan.pendingInvites!.splice(inviteIndex, 1);
                        await plan.save();

                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: true, message: 'Invite accepted' }));

                    } catch (err) {
                        console.error('[Share API] Accept error:', err);
                        res.statusCode = 500;
                        return res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
                    }
                }

                // --- GET /api/invitations/pending-by-token ---
                // Helper to validate token and get info before accepting
                if (req.method === 'GET' && url.startsWith('/api/invitations/pending-by-token')) {
                    try {
                        const urlObj = new URL(url, `http://${req.headers.host}`);
                        const token = urlObj.searchParams.get('token');
                        const planId = urlObj.searchParams.get('planId');

                        if (!token || !planId) {
                            res.statusCode = 400;
                            return res.end(JSON.stringify({ success: false, error: 'Missing token or planId' }));
                        }

                        await dbConnect();
                        const plan = await Itinerary.findById(planId).select('name pendingInvites owner').populate('user', 'name'); // owner is user field

                        if (!plan) {
                            res.statusCode = 404;
                            return res.end(JSON.stringify({ success: false, error: 'Plan not found' }));
                        }

                        const invite = plan.pendingInvites?.find((p: any) => p.token === token);

                        if (!invite) {
                            res.statusCode = 404;
                            return res.end(JSON.stringify({ success: false, error: 'Invitation not found' }));
                        }

                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({
                            success: true,
                            data: {
                                planName: plan.name,
                                ownerName: (plan.user as any)?.name || 'Someone',
                                permission: invite.permission
                            }
                        }));

                    } catch (err) {
                        console.error(err);
                        res.statusCode = 500;
                        return res.end(JSON.stringify({ success: false }));
                    }
                }

                next();
            });
        }
    };
}
