
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:4000/api/upload';

const run = async () => {
    try {
        // Create a dummy file
        const dummyPath = path.join(process.cwd(), 'dummy_test_image.png');
        fs.writeFileSync(dummyPath, 'fake image content');

        const form = new FormData();
        form.append('file', fs.createReadStream(dummyPath));

        console.log('Uploading to:', API_URL);
        const response = await fetch(API_URL, {
            method: 'POST',
            body: form
        });

        const data = await response.json();
        console.log('Response:', data);

        if (data.success) {
            console.log('Upload successful. URL:', data.url);
            // Verify file existence
            const filename = path.basename(data.url);
            const savedPath = path.join(process.cwd(), 'uploads', filename);
            if (fs.existsSync(savedPath)) {
                console.log('File successfully verified on disk:', savedPath);
            } else {
                console.error('File NOT found on disk at:', savedPath);
            }
        } else {
            console.error('Upload failed:', data);
        }

        // Cleanup
        fs.unlinkSync(dummyPath);

    } catch (e) {
        console.error('Error:', e);
    }
};
run();
