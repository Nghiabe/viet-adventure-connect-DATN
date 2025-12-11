// src/lib/auth/getAuthUser.ts
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken'; // 1. Import the entire module as a default export
import cookie from 'cookie';   //    Apply the same pattern to the 'cookie' library for consistency

// 2. Use JavaScript destructuring to get the functions we need.
const { verify } = jwt;
const { parse } = cookie;

interface AuthenticatedUser {
  userId: string;
  role: string;
  // Add any other fields you put in your JWT payload
}

/**
 * A robust, server-side utility to parse and verify a JWT from a request's cookie.
 * @param req The incoming HTTP request object.
 * @returns The decoded user payload if the token is valid, otherwise null.
 */
export function getAuthUser(req: IncomingMessage): AuthenticatedUser | null {
  const handlerName = 'getAuthUser';
  try {
    // 1. Check if cookies exist on the request at all.
    if (!req.headers.cookie) {
      console.log(`[${handlerName}] No cookies found on the request.`);
      return null;
    }

    // 2. Parse the cookie string into an object.
    const cookies = parse(req.headers.cookie);
    
    // 3. Get the specific authentication token. The name 'auth_token' MUST match
    // the name you used when setting the cookie in your login API.
    const token = cookies.auth_token;

    if (!token) {
      console.log(`[${handlerName}] 'auth_token' cookie not found.`);
      return null;
    }

    // 4. Verify the token using the secret key from your environment variables.
    // This will throw an error if the token is invalid or expired.
    const decoded = verify(token, process.env.JWT_SECRET!) as AuthenticatedUser;

    console.log(`[${handlerName}] Token successfully verified for user ID: ${decoded.userId}`);
    
    // 5. Return the decoded payload.
    return decoded;

  } catch (error) {
    // This block will catch errors from `verify` (e.g., TokenExpiredError, JsonWebTokenError).
    console.error(`[${handlerName}] Token verification failed:`, error);
    return null;
  }
}
