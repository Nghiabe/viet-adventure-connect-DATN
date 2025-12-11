import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signJwt } from '@/lib/auth/jwt';
import { serialize } from 'cookie';

// Validation schema for reset password request
const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string().min(6, 'Xác nhận mật khẩu tối thiểu 6 ký tự'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu và xác nhận mật khẩu không khớp',
  path: ['confirmPassword'],
});

function send(res: ServerResponse, status: number, body: unknown, headers?: Record<string, string>) {
  if (headers) {
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

// Helper function to parse request body
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  if (req.method !== 'PUT') {
    return send(res, 405, { 
      success: false, 
      error: 'Phương thức không được hỗ trợ' 
    });
  }

  try {
    await dbConnect();

    // 1. Get token from URL path (e.g., /api/auth/reset-password/abc123)
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const token = pathParts[pathParts.length - 1];
    
    if (!token || token === 'reset-password') {
      return send(res, 400, { 
        success: false, 
        error: 'Token không hợp lệ' 
      });
    }

    // 2. Parse and validate request body
    const body = await parseBody(req);
    const validation = resetPasswordSchema.safeParse(body);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return send(res, 400, { 
        success: false, 
        error: firstError.message 
      });
    }

    const { password } = validation.data;

    // 3. Hash the token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 4. Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return send(res, 400, { 
        success: false, 
        error: 'Token không hợp lệ hoặc đã hết hạn' 
      });
    }

    // 5. Update user password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    // 6. Generate JWT token for automatic login
    const jwtToken = signJwt({ userId: String(user._id), role: user.role });
    
    // 7. Set secure HTTP-only cookie
    const cookie = serialize('auth_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // 8. Remove password from response and return user data
    const { password: _p, ...safeUser } = user.toObject();
    
    return send(res, 200, { 
      success: true, 
      message: 'Mật khẩu đã được đặt lại thành công',
      data: safeUser 
    }, { 'Set-Cookie': cookie });

  } catch (error: any) {
    console.error('[Reset Password API Error]', error);
    return send(res, 500, { 
      success: false, 
      error: 'Đã có lỗi xảy ra ở phía máy chủ.' 
    });
  }
}
