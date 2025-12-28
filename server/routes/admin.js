import express from 'express';
import PartnerService from '../models/PartnerService.js';
import Tour from '../models/Tour.js';
import User from '../models/User.js'; // Assuming you might need user info
// import { requireAdmin } from '../middleware/auth.js'; // TODO: Implement admin auth

const router = express.Router();

// Middleware to check for admin role (placeholder for now, implementing simple check if needed)
// router.use(requireAdmin);

// GET /api/admin/services
router.get('/services', async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, type } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            // Find providers (owners) matching search
            const users = await User.find({
                $or: [{ name: searchRegex }, { email: searchRegex }]
            }).select('_id');
            const userIds = users.map(u => u._id);

            query.$or = [
                { name: searchRegex },
                { owner: { $in: userIds } }
            ];
        }

        const total = await PartnerService.countDocuments(query);
        const services = await PartnerService.find(query)
            .populate('owner', 'name email partnerProfile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        const pages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            data: services,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages
            }
        });
    } catch (error) {
        console.error('Error fetching admin services:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/admin/services/:id/status
router.patch('/services/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const service = await PartnerService.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        res.json({ success: true, data: service });
    } catch (error) {
        console.error('Error updating service status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/admin/services/:id
router.delete('/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await PartnerService.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        res.json({ success: true, data: { message: 'Service deleted' } });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// TOURS MANAGEMENT
// ============================================

// GET /api/admin/tours
router.get('/tours', async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, destinationId, ownerId } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (destinationId) {
            query.destination = destinationId;
        }

        if (ownerId) {
            query.owner = ownerId;
        }

        if (search) {
            // Match title or owner name
            const searchRegex = new RegExp(search, 'i');

            // Find owners matching
            const users = await User.find({ name: searchRegex }).select('_id');
            const userIds = users.map(u => u._id);

            query.$or = [
                { title: searchRegex },
                { owner: { $in: userIds } }
            ];
        }

        const total = await Tour.countDocuments(query);
        const tours = await Tour.find(query)
            .populate('owner', 'name email')
            .populate('destination', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Calculate simple stats for each tour if needed, or rely on schema defaults
        // Schema has reviewCount, averageRating, bookingCount, totalRevenue which we hopefully maintain,
        // or we aggregate if they are not maintained. 
        // For now, assume they are on the document or defaults are fine.

        const pages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            data: {
                tours,
                pagination: {
                    currentPage: pageNum,
                    totalPages: pages,
                    totalTours: total
                }
            }
        });

    } catch (error) {
        console.error('Error fetching admin tours:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/tours/:id/status
router.put('/tours/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log(`[Admin] Updating tour ${id} status to ${status}`);

        if (!['published', 'draft', 'archived', 'pending', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const tour = await Tour.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!tour) {
            return res.status(404).json({ success: false, error: 'Tour not found' });
        }

        res.json({ success: true, data: tour });
    } catch (error) {
        console.error('Error updating tour status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/admin/tours/:id
router.delete('/tours/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Tour.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Tour not found' });
        }

        res.json({ success: true, data: { message: 'Tour deleted' } });
    } catch (error) {
        console.error('Error deleting tour:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


export default router;
