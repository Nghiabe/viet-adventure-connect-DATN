import mongoose from 'mongoose';
import PartnerService from './server/models/PartnerService.js';
import User from './server/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function testSecurity() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected DB');

    // 1. Create a Test Hotel
    const testHotel = await PartnerService.create({
        owner: new mongoose.Types.ObjectId(), // Fake owner
        type: 'hotel',
        name: 'Security Test Hotel',
        price: 1000000, // 1 mil VND base
        roomTypes: [{
            name: 'Deluxe',
            price: 2000000, // 2 mil VND
            quantity: 5
        }]
    });
    console.log('Created Test Hotel, ID:', testHotel._id);

    // 2. Simulate Booking via API (Mocking req.body logic manually since we are node script)
    // We can't easily call the Express app directly without a test runner like Supertest.
    // Instead, we will simulate the logic we just wrote essentially? No, that denies the point.
    // We should try to hit the running server if it's running.
    // Assuming Localhost:4000 is active.

    const payload = {
        userId: '695548b1cb3821bed1b55174', // Replace with valid user ID if needed or let system mock
        // Wait, the new logic requires a valid User ID in token or body.
        // Let's assume we can pass userId in body for this test script if we bypass auth middleware...
        // But the route checks headers.

        // Actually, let's just inspect the Code Verification.
        // If I cannot easily run against the server, I will just trust the Code View?
        // No, I can try fetch.

        hotelId: testHotel._id.toString(),
        checkin: '2026-12-01',
        checkout: '2026-12-02',
        nights: 1,
        rooms: 1,
        bedType: 'Deluxe',

        // ATTACK VECTOR: CLIENT SENDS FAKE PRICE
        unitPrice: 1000,
        totalPrice: 1000
    };

    try {
        // Login first to get token? No, too complex. The server logic (server/index.js) allows userId in body IF token extraction details fail/warn?
        // "Robust Auth: Try to get userId from Token if not in body" -> It checks body.userId FIRST? 
        // Line 1097: let userId = body.userId || null; << YES! So we can spoof userId if we bypass Auth middleware?
        // Wait, app.post('/api/bookings') is NOT protected by requireAuth globally?
        // Line 1089: app.post('/api/bookings', async (req, res) => ...
        // It is NOT protected by `requireAuth` middleware passed to `app.post`.
        // It does manual token extraction inside.

        // So sending userId in body IS allowed if token missing.
        // But line 1117: `if (!userId) { try { ... } }`
        // So if body.userId is present, we are good.

        const res = await fetch('http://localhost:4000/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, userId: '6772718870104e76a1653f58' }) // Use a real-ish looking ID
        });
        const data = await res.json();
        console.log('Booking Response:', data);

        if (data.success) {
            // Check the booked price
            // We need to fetch the booking from DB to be sure, or rely on response data if it returns the booking object.
            // The response usually returns { success: true, booking: ... } or just success.
            // Let's assume we can fetch the booking in this script.
            // Wait, the response might not include the full booking object immediately if logic is async?
            // Looking at code: await booking.save(); await Notification.create...; res.json({ success: true, data: booking });

            if (data.data.totalPrice === 2000000) {
                console.log('✅ SECURITY SUCCESS: Server ignored fake price (1000) and used DB price (2000000).');
            } else {
                console.log('❌ SECURITY FAILURE: Server used price:', data.data.totalPrice);
            }
        } else {
            console.log('Booking Failed:', data.error);
        }

    } catch (e) {
        console.error('Fetch error:', e);
    }

    // Cleanup
    await PartnerService.findByIdAndDelete(testHotel._id);
    await mongoose.disconnect();
}

testSecurity();
