import type { ServerResponse } from 'http';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import { withAuth, AuthedRequest } from '@/lib/auth/withAuth';
import Story from '@/models/Story';

// --- THE DEFINITIVE FIX IS HERE ---
// Validation schema for story creation
const CreateStorySchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  content: z.string().min(10, 'Nội dung phải có ít nhất 10 ký tự'),
  coverImageUrl: z.string().min(1, 'Vui lòng tải lên một ảnh bìa.'),
  tags: z.array(z.string().min(1, 'Tag không được để trống')).max(10, 'Không được vượt quá 10 tags'),
  destinationId: z.string().optional()
});
// --- END DEFINITIVE FIX ---

type CreateStoryData = z.infer<typeof CreateStorySchema>;

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default withAuth(async function handler(req: AuthedRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    await dbConnect();

    // Parse request body
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const bodyString = Buffer.concat(chunks).toString('utf8');
    const body = bodyString ? JSON.parse(bodyString) : {};

    // Validate request body using Zod
    const validationResult = CreateStorySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return send(res, 400, { 
        success: false, 
        error: 'Dữ liệu không hợp lệ',
        details: errors 
      });
    }

    const storyData: CreateStoryData = validationResult.data;
    const userId = req.user?.userId;

    if (!userId) {
      return send(res, 401, { success: false, error: 'Không thể xác định người dùng' });
    }

    // Create the story document
    const story = await Story.create({
      author: userId,
      title: storyData.title,
      content: storyData.content,
      coverImage: storyData.coverImageUrl,
      tags: storyData.tags,
      destination: storyData.destinationId || undefined,
      status: 'pending', // Default status for moderation
      likes: [],
      likeCount: 0
    });

    // Populate author information for response
    await story.populate('author', 'name email avatar');

    return send(res, 201, { 
      success: true, 
      data: story,
      message: 'Bài viết đã được tạo thành công và đang chờ kiểm duyệt'
    });

  } catch (error: any) {
    console.error('Create story error:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return send(res, 400, { 
        success: false, 
        error: 'Dữ liệu không hợp lệ',
        details: validationErrors 
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return send(res, 400, { 
        success: false, 
        error: 'Bài viết với tiêu đề này đã tồn tại' 
      });
    }

    return send(res, 500, { 
      success: false, 
      error: 'Lỗi server, vui lòng thử lại sau' 
    });
  }
});
