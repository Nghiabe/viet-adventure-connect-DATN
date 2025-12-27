import express from 'express';
import Destination from '../models/Destination.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Tour from '../models/Tour.js';
import PartnerService from '../models/PartnerService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Middleware to ensure admin access (simplified, assumes requireAuth checks valid token)
// You might want to add specific admin role check here later
// router.use(requireAuth); 

// GET /api/admin/destinations
router.get('/destinations', async (req, res) => {
    try {
        const { query } = req.query;
        let filter = {};
        if (query) {
            filter = { name: { $regex: query, $options: 'i' } };
        }
        const destinations = await Destination.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: destinations });
    } catch (error) {
        console.error('Error fetching destinations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/destinations/:id
router.get('/destinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const destination = await Destination.findById(id);
        if (!destination) {
            return res.status(404).json({ success: false, error: 'Destination not found' });
        }
        res.json({ success: true, data: destination });
    } catch (error) {
        console.error('Error fetching destination:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/destinations/:id
router.put('/destinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updated = await Destination.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Destination not found' });
        }

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating destination:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/destinations
router.post('/destinations', async (req, res) => {
    try {
        const newDestination = await Destination.create(req.body);
        res.json({ success: true, data: newDestination });
    } catch (error) {
        console.error('Error creating destination:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/admin/destinations/:id
router.delete('/destinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Destination.findByIdAndDelete(id);
        res.json({ success: true, data: { message: 'Deleted successfully' } });
    } catch (error) {
        console.error('Error deleting destination:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// --- Dashboard Stats (Basic) ---

router.get('/dashboard', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalTours = await Tour.countDocuments();
        const totalPartners = await User.countDocuments({ role: { $in: ['partner', 'provider'] } }); // Adjust query based on schema

        res.json({
            success: true,
            data: {
                totalUsers,
                totalBookings,
                totalTours,
                totalPartners
            }
        });
    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Services Management ---

// GET /api/admin/services
router.get('/services', async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, type } = req.query;
        const query = {};

        if (status && status !== 'all') query.status = status;
        if (type && type !== 'all') query.type = type;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const total = await PartnerService.countDocuments(query);
        const services = await PartnerService.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('owner', 'name email');

        res.json({
            success: true,
            data: services,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
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
        const service = await PartnerService.findByIdAndDelete(id);

        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        res.json({ success: true, data: { message: 'Service deleted successfully' } });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
