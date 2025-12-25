
import fetch from 'node-fetch';

async function run() {
    const API_URL = 'http://localhost:4000/api/bookings';

    // Mock User ID (assuming middleware allows passing userId in body or we simulate a token, 
    // but looking at server code it checks body.userId or token. 
    // Code: if (!userId && token) ... so if we pass userId in body it might work if the first check allows it?
    // Checking code: "let userId = body.userId || null;" -> Yes, allows body injection if no token (dev mode friendly likely or flaw)
    // Wait, let's look at server code:
    // "if (!userId) { try { ... token ... } }"
    // So if we pass userId, it is used.

    // We need a valid user ID. 
    // Let's assume we can use a fake one or we need to login first?
    // But wait, "const { default: User } = await import('./models/User.js');"
    // It uses the ID to query or just save?
    // "new Booking({ user: userId ... })" -> It saves it.
    // It doesn't strictly check if user exists in DB before saving (unless Mongoose schema enforces it).
    // Let's try with a dummy ID.

    const dummyUserId = "65abcdef1234567890abcdef";

    const payload = {
        userId: dummyUserId,
        type: 'flight',
        airline: 'Test Airline',
        flightNumber: 'TS123',
        origin: { code: 'HAN', city: 'Hanoi', time: '10:00' },
        destination: { code: 'SGN', city: 'Ho Chi Minh', time: '12:00' },
        class: 'Economy',
        bookingDate: new Date().toISOString(),
        duration: '2h',
        unitPrice: 1000000,
        totalPrice: 1000000,
        currrentDate: new Date().toISOString(),
        participants: 1, // mapped to guests
        customerInfo: {
            name: 'Test Users',
            email: 'test@example.com',
            phone: '0123456789'
        }
    };

    console.log('Sending Flight Booking Payload:', JSON.stringify(payload, null, 2));

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ Flight booking created successfully!');

            // Validation of saved fields
            if (data.booking.type === 'flight' && data.booking.serviceInfo.title.includes('Test Airline')) {
                console.log('✅ Flight type and title verified correctly.');
            } else {
                console.error('❌ Flight data mismatch in response.');
                process.exit(1);
            }

        } else {
            console.error('❌ Failed to create flight booking:', data.error);
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ Network or Server Error:', err);
        process.exit(1);
    }
}

run();
