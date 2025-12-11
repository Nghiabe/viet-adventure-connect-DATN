import type { IncomingMessage, ServerResponse } from 'http';
import { handleImageUpload } from '@/lib/api/mediaHandler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', ['POST']);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: `Method ${req.method} Not Allowed` }));
    return;
  }

  try {
    await handleImageUpload(req, res);
  } catch (error: any) {
    console.error('[MEDIA UPLOAD] Fatal error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
  }
}







