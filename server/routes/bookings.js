import express from 'express';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import PartnerService from '../models/PartnerService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/bookings (List user bookings)
router.get('/', async (req, res) => {
    try {
        let userId = null;
        let token = null;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.headers.cookie) {
            const cookies = parse(req.headers.cookie);
            token = cookies['auth_token'];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
                userId = decoded.userId;
            } catch (e) { }
        }

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // Populate simple fields if needed, but for list usually basic info is enough
        const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });

        return res.json({ success: true, data: bookings });
    } catch (err) {
        console.error('Error fetching bookings:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/bookings/:id (Booking detail)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const booking = await Booking.findOne({ _id: id, user: userId })
            .populate('tour')
            .populate('partnerService'); // Ensure populated data for display

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        return res.json({ success: true, data: booking });

    } catch (err) {
        console.error('Error fetching booking detail:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/bookings/:id/cancel (Cancel booking)
router.patch('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const booking = await Booking.findOne({ _id: id, user: userId });

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (['cancelled', 'completed'].includes(booking.status)) {
            return res.status(400).json({ success: false, error: 'Cannot cancel this booking' });
        }

        booking.status = 'cancelled';
        await booking.save();

        return res.json({ success: true, data: booking });

    } catch (err) {
        console.error('Error cancelling booking:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/bookings
router.post('/', async (req, res) => {
    try {
        const body = req.body || {};
        // Polymorphic ID extraction
        const hotelId = body.hotelId || body.hotel_id || body.hotel || null;
        const tourId = body.tourId || body.tour_id || body.tour || null;

        // Common fields
        let userId = body.userId || null;
        const checkin = body.checkin || body.checkInDate || body.check_in_date || body.bookingDate || null;
        // For tours, checkout might be null or same day+duration
        const checkout = body.checkout || body.checkOutDate || body.check_out_date || null;

        // Guests
        const guestsRaw = body.guests ?? body.adults ?? body.numGuests ?? body.participants ?? null;
        const guests = guestsRaw != null ? Number(guestsRaw) : null;

        // Robust Auth: Try to get userId from Token if not in body
        if (!userId) {
            try {
                let token = null;
                if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                    token = req.headers.authorization.split(' ')[1];
                } else if (req.headers.cookie) {
                    const cookies = parse(req.headers.cookie);
                    token = cookies['auth_token'];
                }

                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
                    if (decoded && decoded.userId) {
                        userId = decoded.userId;
                        // Auto-fix body for consistency
                        body.userId = userId;
                    }
                }
            } catch (e) {
                console.warn('[Booking] Token extraction failed:', e.message);
            }
        }

        if (!userId) {
            console.error('[Booking Error] No userId found in body or token');
            return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập để đặt dịch vụ' });
        }

        // Validation
        if (!hotelId && !tourId && body.type !== 'flight') {
            return res.status(400).json({ success: false, error: 'Missing service identifier (hotelId, tourId or type=flight)' });
        }
        if (!guests) return res.status(400).json({ success: false, error: 'Missing participants/guests count' });

        let newBookingData = {
            user: userId,
            bookingDate: new Date(),
            participants: guests,
            participantsBreakdown: {
                adults: guests,
                children: 0
            },
            contactInfo: {
                name: body.contactName || body.customerInfo?.name || '',
                email: body.contactEmail || body.customerInfo?.email || '',
                phone: body.contactPhone || body.customerInfo?.phone || ''
            },
            paymentMethod: body.paymentMethod || 'cash',
            status: 'pending', // Default
            totalPrice: Number(body.totalPrice || 0)
        };

        // ----- HOTEL LOGIC -----
        if (hotelId) {
            const hotel = await PartnerService.findById(hotelId);
            if (!hotel) return res.status(404).json({ success: false, error: 'Hotel not found' });

            if (!checkin) return res.status(400).json({ success: false, error: 'Missing checkin date for hotel' });
            if (!checkout) return res.status(400).json({ success: false, error: 'Missing checkout date for hotel' });

            const checkinDate = new Date(checkin);
            const checkoutDate = new Date(checkout);
            const nights = body.nights ?? Math.max(1, Math.ceil((checkoutDate - checkinDate) / (24 * 60 * 60 * 1000)));

            newBookingData = {
                ...newBookingData,
                type: 'hotel',
                partnerService: hotelId,
                status: 'provisional', // Hotels often start provisional
                serviceInfo: {
                    title: hotel.name,
                    image: hotel.image || (hotel.images && hotel.images[0]) || '',
                    destination: hotel.location || hotel.address || hotel.city || 'Việt Nam',
                    price: Number(body.unitPrice || hotel.price),
                    checkIn: checkinDate,
                    checkOut: checkoutDate,
                    nights,
                    roomType: body.bedType || body.roomType || 'Standard',
                    providerUrl: body.providerUrl || null
                },
                checkInDate: checkinDate
            };
        }
        // ----- FLIGHT LOGIC -----
        else if (body.type === 'flight') {
            newBookingData = {
                ...newBookingData,
                type: 'flight',
                checkInDate: new Date(body.bookingDate || Date.now()),
                serviceInfo: {
                    title: body.airline ? `${body.airline} (${body.flightNumber})` : 'Vé máy bay',
                    destination: body.destination?.city || 'Việt Nam',
                    price: Number(body.unitPrice || 0),
                    image: body.airline === 'Vietnam Airlines' ? 'https://picsum.photos/seed/vna/120/120' :
                        body.airline === 'VietJet Air' ? 'https://picsum.photos/seed/vja/120/120' :
                            'https://picsum.photos/seed/flight-default/120/120',
                    // Store extra flight details
                    location: `${body.origin?.city} (${body.origin?.code}) - ${body.destination?.city} (${body.destination?.code})`,
                    duration: body.duration,
                    bookingDate: body.date // legacy
                },
            };
        }
        // ----- TOUR LOGIC -----
        else if (tourId) {
            // Import Tour (Dynamic to avoid circular or mock checks)
            const { default: Tour } = await import('../models/Tour.js');
            const tour = await Tour.findById(tourId);
            if (!tour) return res.status(404).json({ success: false, error: 'Tour not found' });

            newBookingData = {
                ...newBookingData,
                type: 'tour',
                tour: tourId,
                serviceInfo: {
                    title: tour.title,
                    image: tour.mainImage,
                    destination: tour.location || 'Việt Nam', // Need to resolve this if possible
                    price: Number(body.unitPrice || tour.price),
                    duration: tour.duration,
                    bookingDate: new Date(body.bookingDate || Date.now())
                },
                checkInDate: new Date(body.bookingDate || Date.now())
            };
        }

        const booking = new Booking(newBookingData);
        await booking.save();

        // Create Notification
        try {
            if (body.hotelId) { // Basic check
                // Notify logic omitted for brevity in migration, can add back if needed
            }
        } catch (e) { }

        return res.status(201).json({ success: true, bookingId: booking._id, data: booking });

    } catch (err) {
        console.error('Create Booking Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
