
import path from 'path';
import fs from 'fs';

console.log('CWD:', process.cwd());
const uploadsPath = path.join(process.cwd(), 'uploads');
console.log('Uploads Path:', uploadsPath);

if (fs.existsSync(uploadsPath)) {
    console.log('Uploads directory exists.');
    const files = fs.readdirSync(uploadsPath);
    console.log('File count:', files.length);
    console.log('First 5 files:', files.slice(0, 5));

    // Check for specific file from previous debug (if I recall correctly?)
    // partial match check
} else {
    console.log('Uploads directory DOES NOT exist at this path.');
    // Check if it exists in parent?
    const parentUploads = path.join(process.cwd(), '..', 'uploads');
    if (fs.existsSync(parentUploads)) {
        console.log('Found uploads in parent directory:', parentUploads);
    }
}
