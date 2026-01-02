import express from 'express';
import Booking from '../models/Booking.js';
import { requireAuth } from '../middleware/auth.js';
import Tour from '../models/Tour.js';

const router = express.Router();

// GET /api/bookings/my-bookings
// Previously fetched via user profile, but this can be a direct list route if needed. 
// For now, let's focus on ACTIONS.

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy đơn đặt hàng' });
        }

        // Verify ownership
        if (booking.user.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'Bạn không có quyền hủy đơn này' });
        }

        // Check if cancellable (e.g., not completed, not already cancelled)
        if (['cancelled', 'completed', 'rejected'].includes(booking.status)) {
            return res.status(400).json({ success: false, error: `Không thể hủy đơn đang ở trạng thái ${booking.status}` });
        }

        // Cancellation Policy: Must be at least 24 hours before check-in/start date
        const checkInTime = booking.checkInDate ? new Date(booking.checkInDate).getTime() : new Date(booking.bookingDate).getTime();
        const now = new Date().getTime();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        if (checkInTime - now < ONE_DAY_MS) {
            return res.status(400).json({ success: false, error: 'Chỉ có thể hủy đơn trước ít nhất 24 giờ so với thời gian bắt đầu.' });
        }

        // Update status
        booking.status = 'cancelled';
        await booking.save();

        // Note: Inventory will be freed automatically if overbooking logic calculates based on non-cancelled bookings.
        // My previous logic filter was: status: { $in: ['confirmed', 'pending', 'provisional'] }
        // So 'cancelled' effectively frees up the spot.

        res.json({ success: true, message: 'Hủy đơn thành công', booking });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
