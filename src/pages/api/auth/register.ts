import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// Validation schema for registration request
const registerSchema = z.object({
  name: z.string().min(1, 'Họ tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  accountType: z.enum(['user', 'partner'], { 
    errorMap: () => ({ message: 'Loại tài khoản không hợp lệ' })
  })
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
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return send(res, 400, { 
        success: false, 
        error: firstError.message 
      });
    }

    const { name, email, password, accountType } = validation.data;

    // 2. Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return send(res, 409, { 
        success: false, 
        error: 'Địa chỉ email này đã được sử dụng.' 
      });
    }

    // --- CRITICAL ROLE & STATUS LOGIC ---
    let role = 'user';
    let status = 'active';

    // This is the core business logic fix.
    if (accountType === 'partner') {
      role = 'user'; // They are still a 'user' until approved.
      status = 'pending_approval'; // This flag is for the admin to see.
    }
    
    // The API NEVER assigns 'staff' or 'admin' roles from this public endpoint.

    const user = new User({ name, email: email.toLowerCase(), password, role, status });
    await user.save();

    const { password: _p, ...safe } = user.toObject();
    return send(res, 201, { 
      success: true, 
      data: safe 
    });

  } catch (error: any) {
    console.error('[Register API Error]', error);
    return send(res, 500, { 
      success: false, 
      error: 'Đã có lỗi xảy ra ở phía máy chủ.' 
    });
  }
}