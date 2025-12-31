import express from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reviews - Create a review
router.post('/', requireAuth, async (req, res) => {
    try {
        const { tourId, rating, comment } = req.body;
        const userId = req.user.userId;

        if (!tourId || !rating) {
            return res.status(400).json({ success: false, error: 'Tour ID and rating are required' });
        }

        // 1. Verify User has a verified booking for this tour
        // We assume 'confirmed' means they went or are going. 
        // Ideally check checkOutDate < Now for "Completed".
        const booking = await Booking.findOne({
            user: userId,
            tour: tourId,
            status: { $in: ['confirmed', 'completed'] }
        });

        if (!booking) {
            return res.status(403).json({
                success: false,
                error: 'Bạn chưa tham gia tour này hoặc đơn hàng chưa được xác nhận, nên không thể đánh giá.'
            });
        }

        // 2. Check strict timing: Review only AFTER the trip?
        // Optional: Ensure trip has started/ended.
        if (booking.checkInDate && new Date(booking.checkInDate) > new Date()) {
            return res.status(403).json({
                success: false,
                error: 'Chuyến đi chưa diễn ra. Vui lòng quay lại đánh giá sau khi kết thúc chuyến đi.'
            });
        }

        // 3. Create Review
        const newReview = await Review.create({
            user: userId,
            tour: tourId,
            rating: Number(rating),
            comment,
            status: 'approved' // Auto-approve or pending? Let's auto-approve for now but model default is 'pending'
        });

        res.status(201).json({ success: true, data: newReview });

    } catch (error) {
        // Handle duplicate key error (User already reviewed this tour)
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'Bạn đã đánh giá tour này rồi.' });
        }
        console.error('Create review error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/reviews/tour/:tourId
router.get('/tour/:tourId', async (req, res) => {
    try {
        const { tourId } = req.params;
        const reviews = await Review.find({ tour: tourId, status: 'approved' })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/reviews/check/:tourId - Check if user can review
router.get('/check/:tourId', requireAuth, async (req, res) => {
    try {
        const { tourId } = req.params;
        const userId = req.user.userId;

        // 1. Check if already reviewed
        const existingReview = await Review.findOne({ user: userId, tour: tourId });
        if (existingReview) {
            return res.json({ success: true, canReview: false, reason: 'already_reviewed' });
        }

        // 2. Check for valid booking
        // Must be confirmed or completed.
        // And checkInDate must be in the past (trip started/done).
        const booking = await Booking.findOne({
            user: userId,
            tour: tourId,
            status: { $in: ['confirmed', 'completed'] },
            checkInDate: { $lt: new Date() }
        });

        if (!booking) {
            return res.json({ success: true, canReview: false, reason: 'no_valid_past_booking' });
        }

        res.json({ success: true, canReview: true });

    } catch (error) {
        console.error('Check review eligibility error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
