
import type { ViteDevServer } from 'vite';

export function storyInteractionPlugin() {
    return {
        name: 'vite-plugin-story-interaction-api',
        configureServer(server: ViteDevServer) {
            // Handle POST /api/stories/:id/like
            server.middlewares.use(async (req: any, res: any, next: any) => {
                const url = req.originalUrl || req.url || '';
                const match = url.match(/^\/api\/stories\/([a-zA-Z0-9]+)\/like$/);

                if (req.method !== 'POST' || !match) {
                    return next();
                }

                try {
                    const storyId = match[1];
                    console.log(`[VITE API] POST /api/stories/${storyId}/like`);

                    // 1. Auth Check - Duplicate logic from other plugins or import a helper if available
                    const { parse } = await import('cookie');
                    // Use a dynamic import for jwt to avoid build issues if strictly typed differently
                    const { verifyJwt } = await import('../lib/auth/jwt');

                    const cookies = parse(req.headers.cookie || '');
                    const token = cookies['auth_token'];

                    if (!token) {
                        res.statusCode = 401;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Vui lòng đăng nhập để thực hiện chức năng này' }));
                    }

                    const payload = verifyJwt(token);
                    if (!payload || !payload.userId) {
                        res.statusCode = 401;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Phiên đăng nhập không hợp lệ' }));
                    }

                    const userId = payload.userId;

                    // 2. DB Interaction
                    const { default: dbConnect } = await import('../lib/dbConnect');
                    const { default: Story } = await import('../models/Story');

                    await dbConnect();
                    const story = await Story.findById(storyId);

                    if (!story) {
                        res.statusCode = 404;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Bài viết không tồn tại' }));
                    }

                    // Toggle Like
                    // Ensure likes is an array
                    if (!Array.isArray(story.likes)) {
                        story.likes = [];
                    }

                    // Check if user already liked
                    // Need to handle ObjectId vs String comparison carefully
                    const userIndex = story.likes.findIndex((id: any) => id.toString() === userId);
                    const alreadyLiked = userIndex !== -1;

                    if (alreadyLiked) {
                        story.likes.splice(userIndex, 1);
                    } else {
                        story.likes.push(userId as any);
                    }

                    story.likeCount = story.likes.length;
                    await story.save();

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({
                        success: true,
                        likeCount: story.likeCount,
                        isLiked: !alreadyLiked
                    }));

                } catch (error: any) {
                    console.error('[VITE API] Story Like Error:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, error: error.message || 'Server Error' }));
                }
            });

            // Handle POST /api/stories/:id/comments
            server.middlewares.use(async (req: any, res: any, next: any) => {
                const url = req.originalUrl || req.url || '';
                const match = url.match(/^\/api\/stories\/([a-zA-Z0-9]+)\/comments$/);

                if (req.method !== 'POST' || !match) {
                    return next();
                }

                try {
                    const storyId = match[1];
                    console.log(`[VITE API] POST /api/stories/${storyId}/comments`);

                    // Body Parsing
                    let body = '';
                    await new Promise<void>((resolve, reject) => {
                        req.on('data', (chunk: any) => body += chunk);
                        req.on('end', () => resolve());
                        req.on('error', reject);
                    });

                    let parsedBody = {};
                    try {
                        parsedBody = JSON.parse(body);
                    } catch (e) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
                    }

                    const { content } = parsedBody as any;
                    if (!content || !content.trim()) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Nội dung bình luận không được để trống' }));
                    }

                    // Auth Check
                    const { parse } = await import('cookie');
                    const { verifyJwt } = await import('../lib/auth/jwt');

                    const cookies = parse(req.headers.cookie || '');
                    const token = cookies['auth_token'];

                    if (!token) {
                        res.statusCode = 401;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Vui lòng đăng nhập để bình luận' }));
                    }

                    const payload = verifyJwt(token);
                    if (!payload || !payload.userId) {
                        res.statusCode = 401;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Phiên đăng nhập không hợp lệ' }));
                    }

                    const userId = payload.userId;

                    // DB Interaction
                    const { default: dbConnect } = await import('../lib/dbConnect');
                    const { default: Story } = await import('../models/Story');
                    const { default: Comment } = await import('../../server/models/Comment.js'); // Use the one I created in server/models
                    // OR src/models/Comment if I should create it there?
                    // The project structure seems to split models between src/models and server/models?
                    // vite.config.ts imports from ./src/models/...
                    // But I created Comment.js in server/models/Comment.js.
                    // I should verify if I should duplicate it or import from server.
                    // Importing from outside src in vite might be fine for server-side code (ssr/middleware).
                    // Let's rely on server/models/Comment.js but using absolute path or relative
                    // Relative to src/plugins is ../../server/models/Comment.js

                    await dbConnect();

                    const story = await Story.findById(storyId);
                    if (!story) {
                        res.statusCode = 404;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Bài viết không tồn tại' }));
                    }

                    // Create Comment - Mongoose model usage
                    // Note: User model usually needs to be updated if bidirectional, but Comment usually stands alone or with ref

                    const newComment = new Comment({
                        content: content.trim(),
                        story: storyId,
                        author: userId
                    });

                    await newComment.save();

                    // Populate author info for return
                    // We need to make sure 'User' model is registered for population
                    const { default: User } = await import('../models/User'); // Register User model just in case

                    await newComment.populate('author', 'name avatar');

                    res.statusCode = 201;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: true, data: newComment }));

                } catch (error: any) {
                    console.error('[VITE API] Comment Submit Error:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, error: error.message || 'Server Error' }));
                }
            });

            // Handle GET /api/stories/:id/comments
            server.middlewares.use(async (req: any, res: any, next: any) => {
                const url = req.originalUrl || req.url || '';
                const match = url.match(/^\/api\/stories\/([a-zA-Z0-9]+)\/comments$/);

                if (req.method !== 'GET' || !match) {
                    return next();
                }

                try {
                    const storyId = match[1];

                    const { default: dbConnect } = await import('../lib/dbConnect');
                    const { default: Comment } = await import('../../server/models/Comment.js');
                    const { default: User } = await import('../models/User'); // Register User

                    await dbConnect();

                    const comments = await Comment.find({ story: storyId })
                        .sort({ createdAt: -1 })
                        .populate('author', 'name avatar')
                        .lean();

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: true, data: comments }));
                } catch (error: any) {
                    console.error('[VITE API] Get Comments Error:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, error: error.message || 'Server Error' }));
                }
            });
        }
    }
}
