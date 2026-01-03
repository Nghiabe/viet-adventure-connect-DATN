import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js'; // Assuming you have this
import Story from '../models/Story.js';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Fetch Basic User Info
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // 2. Fetch Journeys (Bookings) - EXCLUDE provisional (Chat Inquiries)
        // We want all real bookings for this user, sorted by date
        const bookings = await Booking.find({
            user: userId,
            status: { $ne: 'provisional' } // Hide chat inquiries
        })
            .sort({ bookingDate: -1 })
            .populate('tour', 'title mainImage slug destination') // Populate generic tour info
            .populate('partnerService', 'name image type') // Populate partner service info
            .lean();

        // 3. Transform Bookings into "Journeys" format for frontend
        const journeys = bookings.map(b => {
            // Determine title and image based on booking type
            let title = b.serviceInfo?.title || 'Unknown Service';
            let image = b.serviceInfo?.image;

            // Fallback to populated fields if snapshot is missing
            if (!title && b.tour) title = b.tour.title;
            if (!title && b.partnerService) title = b.partnerService.name;

            if (!image && b.tour) image = b.tour.mainImage;
            if (!image && b.partnerService) image = b.partnerService.image;

            return {
                _id: b._id,
                status: b.status,
                bookingDate: b.bookingDate,
                checkInDate: b.checkInDate || b.bookingDate,
                participants: b.participants,
                totalPrice: b.totalPrice,
                type: b.type,
                // Frontend expects these nested or flat. Let's provide a structure that matches JourneyCard.tsx expectations
                tourTitle: title,
                mainImage: image,
                destination: b.serviceInfo?.destination || (b.tour?.destination?.name) || '',

                // Pass full snapshot for accurate display
                serviceInfo: b.serviceInfo,

                // Keep original refs just in case
                tour: b.tour,
                partnerService: b.partnerService
            };
        });

        // 4. Gamification (Mock for now, or fetch real data if models exist)
        // You might want to implement a real Badge model later.
        const gamification = {
            earnedBadgesCount: 5,
            totalBadgesCount: 20,
            completionPercentage: 25,
            allBadges: [
                { _id: '1', name: 'Nhà thám hiểm', isEarned: true, iconUrl: 'compass' },
                { _id: '2', name: 'Người mở đường', isEarned: true, iconUrl: 'map' },
                { _id: '3', name: 'Thợ săn ảnh', isEarned: true, iconUrl: 'camera' },
                { _id: '4', name: 'Reviewer có tâm', isEarned: true, iconUrl: 'star' },
                { _id: '5', name: 'Khách hàng thân thiết', isEarned: true, iconUrl: 'heart' },
                { _id: '6', name: 'Chúa tể biển cả', isEarned: false, iconUrl: 'anchor' },
                // ... more mock badges
            ]
        };

        // 5. Stories (Posts)
        // 5. Stories (Posts)
        const stories = await Story.find({ author: userId })
            .select('title content coverImage likeCount status createdAt slug')
            .sort({ createdAt: -1 });

        // Calculate member since
        const memberSince = user.createdAt;

        // Return combined payload
        res.json({
            success: true,
            data: {
                profile: {
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar, // Ensure UI handles this URL
                    avatarInitials: user.name ? user.name.charAt(0).toUpperCase() : 'U',
                    memberSince: memberSince,
                    level: 'Thành viên Bạc', // Mock level logic
                    phone: user.phone || '',
                    address: user.address || '',
                    bio: user.bio || '',
                    birthDate: user.birthDate || null
                },
                gamification,
                journeys,
                stories
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/users/profile/details
router.put('/profile/details', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, avatar, phone, address, bio, birthDate } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (avatar) updateData.avatar = avatar;

        // We need to ensure User schema supports these. 
        // If strict mode is on, we must add them to Schema first.
        // For Mongoose by default, if strict is 'true' (default), fields not in schema are ignored.
        // We will assume UserSchema needs update or we blindly try to update if strict: false.
        // Best practice: Update User.js model schema. Check Step 1B.

        // Regex Validation for Phone
        const phoneRegex = /^[0-9+]{9,15}$/;
        if (phone && !phoneRegex.test(phone)) {
            return res.status(400).json({ success: false, error: 'Số điện thoại không hợp lệ' });
        }

        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        if (bio) updateData.bio = bio;
        if (birthDate) updateData.birthDate = birthDate;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            data: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
