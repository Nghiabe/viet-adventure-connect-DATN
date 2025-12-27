import express from 'express';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', async (req, res) => {
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

        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Find User
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Find Bookings (Journeys)
        const bookings = await Booking.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate('tour')
            .populate('partnerService') // Enable population for hotels
            .lean();

        const journeys = bookings.map(b => {
            // Determine Image - Prefer serviceInfo.image (Snapshot)
            let img = b.serviceInfo?.image || null;
            if (!img && b.type === 'tour' && b.tour?.mainImage) img = b.tour.mainImage;
            else if (!img && b.type === 'hotel' && b.partnerService) {
                img = b.partnerService.image || (b.partnerService.images && b.partnerService.images[0]);
            }

            // Determine Destination/Location - Prefer serviceInfo.destination (Snapshot)
            let location = b.serviceInfo?.destination || 'Việt Nam';
            if (!b.serviceInfo?.destination) {
                if (b.type === 'tour' && b.tour?.destination?.name) location = b.tour.destination.name;
                else if (b.type === 'hotel' && b.partnerService) {
                    location = b.partnerService.city || b.partnerService.location || b.partnerService.address;
                }
            }

            return {
                _id: b._id,
                tourTitle: b.serviceInfo?.title || b.tour?.title || b.partnerService?.name || 'Chuyến đi',
                bookingDate: b.bookingDate,
                status: b.status,
                totalPrice: b.totalPrice,
                participants: b.participants,
                mainImage: img,
                destination: location,
                type: b.type,
                tour: b.tour, // Pass full object
                partnerService: b.partnerService // Pass full object
            };
        });

        // Mock Gamification/Badges (since schemas might be complex or missing, providing Safe Defaults)
        const gamification = {
            earnedBadgesCount: 0,
            totalBadgesCount: 10,
            completionPercentage: 0,
            allBadges: [],
            categorizedBadges: []
        };

        // Mock Stories
        const stories = [];

        // Construct Payload
        const responsePayload = {
            profile: {
                name: user.name,
                avatarInitials: user.name ? user.name.charAt(0).toUpperCase() : 'U',
                memberSince: user.createdAt,
                level: 'Thành viên'
            },
            gamification,
            journeys,
            stories
        };

        return res.json({ success: true, data: responsePayload });

    } catch (err) {
        console.error('Error fetching user profile:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
