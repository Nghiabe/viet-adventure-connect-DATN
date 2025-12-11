// src/lib/api/mediaHandler.ts
import { IncomingMessage, ServerResponse } from 'http';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';

// This config is for Next.js and is NOT needed in Vite. We handle this manually.
// export const config = { api: { bodyParser: false } };

export function handleImageUpload(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('[FORMIDABLE ERROR]', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: `File parsing error: ${err.message}` }));
        return resolve();
      }

      // --- THE DEFINITIVE FIX ---
      // Rationale: Formidable wraps single file uploads in an array. We must expect an array.
      const filesArray = files.file;

      // 1. Check if the array exists and is not empty.
      if (!filesArray || filesArray.length === 0) {
        console.error('[MEDIA HANDLER] The "file" array is missing or empty.');
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Không có file nào được tải lên.' }));
        return resolve();
      }

      // 2. Access the first element of the array.
      const uploadedFile = filesArray[0];
      // --- END DEFINITIVE FIX ---

      if (!uploadedFile) {
        // This is a fallback, but the check above should catch it.
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'File tải lên không hợp lệ.' }));
        return resolve();
      }

      const publicUrl = `/uploads/images/${path.basename(uploadedFile.filepath)}`;
      console.log(`[MEDIA HANDLER] File uploaded successfully. Public URL: ${publicUrl}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, data: { url: publicUrl } }));
      return resolve();
    });
  });
}