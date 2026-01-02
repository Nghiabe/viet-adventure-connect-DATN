import express from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Tour from '../models/Tour.js'; // Helper to ensure model is loaded
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reviews/mine/:tourId - Get current user's review for a tour
router.get('/mine/:tourId', requireAuth, async (req, res) => {
    try {
        const { tourId } = req.params;
        const userId = req.user.userId;

        const review = await Review.findOne({ user: userId, tour: tourId });
        if (!review) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: review });
    } catch (error) {
        console.error('Get my review error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/reviews - Create a review
router.post('/', requireAuth, async (req, res) => {
    try {
        console.log('[REVIEW] Request Body:', req.body);
        const { tourId, rating, comment } = req.body;
        const userId = req.user.userId;

        if (!tourId || !rating) {
            return res.status(400).json({ success: false, error: 'Tour ID and rating are required' });
        }

        // 1. Verify User has a verified booking
        const booking = await Booking.findOne({
            user: userId,
            tour: tourId,
            status: { $in: ['confirmed', 'completed'] },
            // Optional: checkInDate: { $lt: new Date() } - stricter check
        });

        if (!booking) {
            return res.status(403).json({
                success: false,
                error: 'Bạn chưa có đơn đặt tour hợp lệ để đánh giá.'
            });
        }

        // 2. Create Review
        const newReview = await Review.create({
            user: userId,
            tour: tourId,
            rating: Number(rating),
            comment,
            status: 'pending' // Enforce moderation
        });

        // 3. Mark booking as reviewed
        await Booking.findByIdAndUpdate(booking._id, { isReviewed: true });

        res.status(201).json({ success: true, data: newReview });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'Bạn đã đánh giá tour này rồi.' });
        }
        console.error('Create review error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/reviews/:id - Update a review
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.userId;

        const review = await Review.findOne({ _id: id, user: userId });
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        if (rating) review.rating = Number(rating);
        if (comment !== undefined) review.comment = comment;

        await review.save(); // triggers post-save hook for average rating

        res.json({ success: true, data: review });

    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const review = await Review.findOne({ _id: id, user: userId });
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        const tourId = review.tour;

        // Delete using deleteOne to assume hooks might need explicit call if model setup differs, 
        // but typically document.remove() or deleteOne() is best. 
        // Note: ReviewSchema.post('remove') works with doc.remove(). 
        // mongoose >= 5.x uses deleteOne.

        await Review.deleteOne({ _id: id });

        // Trigger Average Calc manually or ensure hook works. 
        // The scheme has "remove" hook, which is deprecated. 
        // Let's call calc manually to be safe.
        await Review.calculateAverageRating(tourId);

        // Reset Booking isReviewed status
        // We find the booking for this user/tour and set isReviewed = false
        // Ideally we should have stored bookingId in review, but we can infer it.
        await Booking.findOneAndUpdate(
            { user: userId, tour: tourId, status: { $in: ['confirmed', 'completed'] } },
            { isReviewed: false }
        );

        res.json({ success: true, message: 'Deleted review successfully' });

    } catch (error) {
        console.error('Delete review error:', error);
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

        const booking = await Booking.findOne({
            user: userId,
            tour: tourId,
            status: { $in: ['confirmed', 'completed'] },
            // checkInDate: { $lt: new Date() }
        });

        if (!booking) {
            return res.json({ success: true, canReview: false, reason: 'no_booking' });
        }

        // Check if already reviewed (double check)
        const review = await Review.findOne({ user: userId, tour: tourId });

        res.json({
            success: true,
            canReview: true,
            hasReviewed: !!review, // Inform frontend if they have reviewed
            bookingId: booking._id,
            isReviewed: booking.isReviewed // Should match hasReviewed usually
        });

    } catch (error) {
        console.error('Check review eligibility error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
