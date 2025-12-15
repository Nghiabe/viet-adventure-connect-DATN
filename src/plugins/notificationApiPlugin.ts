
import { type ViteDevServer } from 'vite';
import { verifyJwt } from '../lib/auth/jwt';
import dbConnect from '../lib/dbConnect';

export function notificationApiPlugin() {
    return {
        name: 'vite-plugin-notification-api',
        configureServer(server: ViteDevServer) {
            server.middlewares.use(async (req: any, res: any, next: any) => {
                const url = req.originalUrl || req.url || '';

                // Helper for JSON response
                const sendJson = (statusCode: number, data: any) => {
                    res.statusCode = statusCode;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                };

                // --- GET /api/notifications ---
                if (req.method === 'GET' && url === '/api/notifications') {
                    try {
                        const { parse } = await import('cookie');
                        const cookies = parse(req.headers.cookie || '');
                        const token = cookies['auth_token'];
                        const payload = token ? verifyJwt(token) : null;

                        if (!payload || !payload.userId) {
                            return sendJson(401, { success: false, error: 'Authentication required' });
                        }

                        await dbConnect();
                        const { default: Notification } = await import('../models/Notification');

                        const notifications = await Notification.find({ recipient: payload.userId })
                            .sort({ createdAt: -1 })
                            .limit(20)
                            .lean();

                        const unreadCount = await Notification.countDocuments({ recipient: payload.userId, isRead: false });

                        return sendJson(200, { success: true, data: notifications, unreadCount });
                    } catch (err: any) {
                        console.error('[Notification API] Error fetching notifications:', err);
                        return sendJson(500, { success: false, error: err.message });
                    }
                }

                // --- PUT /api/notifications/read ---
                if (req.method === 'PUT' && url === '/api/notifications/read') {
                    try {
                        const { parse } = await import('cookie');
                        const cookies = parse(req.headers.cookie || '');
                        const token = cookies['auth_token'];
                        const payload = token ? verifyJwt(token) : null;

                        if (!payload || !payload.userId) {
                            return sendJson(401, { success: false, error: 'Authentication required' });
                        }

                        const body = await new Promise<any>((resolve, reject) => {
                            let b = '';
                            req.on('data', (c: any) => b += c);
                            req.on('end', () => {
                                try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); }
                            });
                            req.on('error', reject);
                        });

                        const { notificationId } = body;
                        await dbConnect();
                        const { default: Notification } = await import('../models/Notification');

                        if (notificationId) {
                            await Notification.findByIdAndUpdate(notificationId, { isRead: true });
                        } else {
                            // Mark all as read
                            await Notification.updateMany({ recipient: payload.userId, isRead: false }, { isRead: true });
                        }

                        return sendJson(200, { success: true });
                    } catch (err: any) {
                        console.error('[Notification API] Error marking read:', err);
                        return sendJson(500, { success: false, error: err.message });
                    }
                }

                next();
            });
        }
    };
}
