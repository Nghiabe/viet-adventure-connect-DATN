import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/emailService';

// Validation schema for forgot password request
const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
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
  if (req.method !== 'POST') {
    return send(res, 405, { 
      success: false, 
      error: 'Phương thức không được hỗ trợ' 
    });
  }

  try {
    await dbConnect();

    // 1. Parse and validate request body
    const body = await parseBody(req);
    const validation = forgotPasswordSchema.safeParse(body);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return send(res, 400, { 
        success: false, 
        error: firstError.message 
      });
    }

    const { email } = validation.data;

    // 2. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // 3. SECURITY: Always return success to prevent user enumeration
    // Even if user doesn't exist, we return the same response
    if (!user) {
      return send(res, 200, { 
        success: true, 
        message: 'Nếu tài khoản với email này tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' 
      });
    }

    // 4. Generate password reset token
    const resetToken = user.createPasswordResetToken();
    
    // 5. Save user with reset token (disable validation to save without password)
    await user.save({ validateBeforeSave: false });

    // 6. Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      
      return send(res, 200, { 
        success: true, 
        message: 'Nếu tài khoản với email này tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' 
      });
    } catch (emailError) {
      // If email fails, clear the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      console.error('[Forgot Password] Email sending failed:', emailError);
      return send(res, 500, { 
        success: false, 
        error: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.' 
      });
    }

  } catch (error: any) {
    console.error('[Forgot Password API Error]', error);
    return send(res, 500, { 
      success: false, 
      error: 'Đã có lỗi xảy ra ở phía máy chủ.' 
    });
  }
}
