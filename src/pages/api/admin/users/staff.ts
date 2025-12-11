import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readBody(req: any) {
  return new Promise<any>((resolve, reject) => {
    let b = ''; req.on('data',(c:any)=>b+=c.toString()); req.on('end',()=>{ try { resolve(JSON.parse(b||'{}')); } catch(e){ reject(e);} }); req.on('error',reject);
  });
}

async function handler(req: AuthedRequest, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { success: false, error: 'Method Not Allowed' });
  await dbConnect();
  const { name, email, password } = await readBody(req);
  if (!name || !email || !password) return send(res, 400, { success: false, error: 'All fields are required' });
  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) return send(res, 409, { success: false, error: 'User already exists' });
  const user = await User.create({ name: name.trim(), email: String(email).toLowerCase(), password, role: 'staff', status: 'active' });
  const safe = user.toObject(); delete (safe as any).password;
  return send(res, 201, { success: true, data: safe });
}

export default withRole(['admin'], handler);






















































