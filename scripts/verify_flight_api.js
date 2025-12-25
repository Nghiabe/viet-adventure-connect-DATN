
import fetch from 'node-fetch';

async function run() {
    const baseUrl = 'http://localhost:4000/api/flights';
    console.log('--- Verifying Flight API (ESM) ---');

    // Test 1: No params
    try {
        const res = await fetch(baseUrl);
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Test 1 Failed to parse JSON:', text.substring(0, 100));
            return;
        }

        console.log('Test 1 - No params:', data.success ? 'PASS' : 'FAIL', `Total: ${data.total}`);
        if (!data.success) console.error(data.error);
    } catch (e) {
        console.error('Test 1 Error:', e.message);
    }

    // Test 2: Search with params and filters
    try {
        const params = new URLSearchParams({
            from: 'Hanoi',
            to: 'Danang',
            stops: '0',
            classes: 'Business'
        });
        const res = await fetch(`${baseUrl}?${params.toString()}`);
        const data = await res.json();
        console.log('Test 2 - Filters (Stops=0, Class=Business):', data.success ? 'PASS' : 'FAIL', `Count: ${data.data ? data.data.length : 0}`);

        if (data.data && data.data.length > 0) {
            const sample = data.data[0];
            console.log(`   Sample Flight: Airline=${sample.airline}, Stops=${sample.stops}, Class=${sample.class}`);

            // Verification logic
            if (sample.stops === 0 && sample.class === 'Business') {
                console.log('   Filter Logic Verified: SUCCESS');
            } else {
                console.log('   Filter Logic Verified: FAIL (Data mismatch)');
            }
        }
    } catch (e) {
        console.error('Test 2 Error:', e.message);
    }
}

run();
