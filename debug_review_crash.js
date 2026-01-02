
import fetch from 'node-fetch';

const run = async () => {
    try {
        // Need a valid token and data to test properly, but let's test a basic hit
        // to see if the server crashes or returns 401/400.
        // User ID and Tour ID are needed.
        // I'll just try to hit the endpoint and expect 401 (Unauthorized) or 400.
        // If connection refused or socket hang up, it confirms a crash.

        const response = await fetch('http://localhost:4000/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tourId: '69554812cb3821bed1b55161', rating: 5, comment: 'Test' })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Body:', data);

    } catch (e) {
        console.error('Error:', e);
    }
};
run();
