
import fetch from 'node-fetch';

async function check(url) {
    try {
        console.log(`Fetching ${url}...`);
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const json = await res.json();
            console.log('Body:', JSON.stringify(json, null, 2));
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

// User's story ID from screenshot: 694bbd14bdd7217ade13e46d
await check(`http://localhost:4000/api/stories/694bbd14bdd7217ade13e46d`);
