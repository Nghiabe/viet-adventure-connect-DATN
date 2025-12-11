import jwt from 'jsonwebtoken';

export interface JwtPayloadMinimal {
  userId: string;
  role: 'user' | 'partner' | 'admin';
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signJwt(payload: JwtPayloadMinimal): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): JwtPayloadMinimal | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayloadMinimal;
  } catch {
    return null;
  }
}





