
import fetch from 'node-fetch';

async function check(url) {
    try {
        const res = await fetch(url);
        if (res.ok) {
            const json = await res.json();
            console.log('Author:', json.data.author);
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

await check(`http://localhost:4000/api/stories/694bbd14bdd7217ade13e46d`);
