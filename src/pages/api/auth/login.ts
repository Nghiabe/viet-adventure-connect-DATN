import type { IncomingMessage, ServerResponse } from 'http';
import { serialize } from 'cookie';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signJwt } from '@/lib/auth/jwt';

// Validation schema for login request
const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
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
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return send(res, 400, { 
        success: false, 
        error: 'Email hoặc mật khẩu không hợp lệ.' 
      });
    }

    const { email, password } = validation.data;

    // 2. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      // Use a generic error message for security
      return send(res, 401, { 
        success: false, 
        error: 'Email hoặc mật khẩu không chính xác.' 
      });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return send(res, 401, { 
        success: false, 
        error: 'Email hoặc mật khẩu không chính xác.' 
      });
    }

    // 4. Generate JWT token
    const token = signJwt({ userId: String(user._id), role: user.role });
    
    // 5. Set secure HTTP-only cookie
    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // 6. Remove password from response and return user data
    const { password: _p, ...safeUser } = user.toObject();
    
    return send(res, 200, { 
      success: true, 
      data: safeUser 
    }, { 'Set-Cookie': cookie });

  } catch (error: any) {
    console.error('[Login API Error]', error);
    return send(res, 500, { 
      success: false, 
      error: 'Đã có lỗi xảy ra ở phía máy chủ.' 
    });
  }
}





