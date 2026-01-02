import express from 'express';
import PartnerService from '../models/PartnerService.js';
import Tour from '../models/Tour.js';
import User from '../models/User.js';
import Review from '../models/Review.js'; // Added Review Model
import Story from '../models/Story.js';   // Added Story Model
import Destination from '../models/Destination.js'; // Added Destination Model
import { requireAdmin } from '../middleware/auth.js'; // Import requireAdmin

const router = express.Router();

// Apply Admin Middleware globally for this router
router.use(requireAdmin);

// ============================================
// DASHBOARD STATS (Optional - can be added later)
// ============================================

// ============================================
// DESTINATIONS MANAGEMENT
// ============================================

// GET /api/admin/destinations
router.get('/destinations', async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const total = await Destination.countDocuments(query);
        const destinationsDb = await Destination.find(query)
            .sort({ name: 1 }) // Sort by name alphabetically
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Enhance with stats (slow but needed for Admin Table)
        const destinations = await Promise.all(destinationsDb.map(async (d) => {
            const tourCount = await Tour.countDocuments({ destination: d._id });
            return {
                ...d,
                tourCount,
                totalBookings: 0,
                totalRevenue: 0
            };
        }));

        res.json({
            success: true,
            data: {
                rows: destinations,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching destinations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/destinations/:id
router.get('/destinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let destination;

        // Support lookup by ID or Slug
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            destination = await Destination.findById(id);
        } else {
            destination = await Destination.findOne({ slug: id });
        }

        if (!destination) {
            return res.status(404).json({ success: false, error: 'Destination not found' });
        }
        res.json({ success: true, data: destination });
    } catch (error) {
        console.error('Error fetching destination detail:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/destinations
router.post('/destinations', async (req, res) => {
    try {
        const body = req.body;

        // 1. Validate required fields
        if (!body.name || !body.slug) {
            return res.status(400).json({ success: false, error: 'Name and Slug are required' });
        }

        // 2. Check Slug Uniqueness
        const existing = await Destination.findOne({ slug: body.slug });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Slug (Đường dẫn) already exists. Please choose another one.' });
        }

        // 3. Create
        const newDestination = await Destination.create(body);
        res.json({ success: true, data: newDestination });

    } catch (error) {
        console.error('Error creating destination:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'Duplicate key error (Slug likely exists)' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/destinations/:id
router.put('/destinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;

        // 1. Check Slug Uniqueness if changing slug
        if (body.slug) {
            const existing = await Destination.findOne({ slug: body.slug, _id: { $ne: id } });
            if (existing) {
                return res.status(400).json({ success: false, error: 'Slug already exists on another destination' });
            }
        }

        const updated = await Destination.findByIdAndUpdate(id, body, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Destination not found' });
        }

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating destination:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'Slug already exists' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/admin/destinations/:id
router.delete('/destinations/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. SAFE DELETE CHECK
        const tourCount = await Tour.countDocuments({
            $or: [
                { destination: id },
                { 'destinations.destinationId': id }
            ]
        });

        if (tourCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete: This destination is used by ${tourCount} tours. Please reassign or delete those tours first.`
            });
        }

        const deleted = await Destination.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Destination not found' });
        }

        res.json({ success: true, data: { message: 'Destination deleted successfully' } });

    } catch (error) {
        console.error('Error deleting destination:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// ============================================
// MODERATION: REVIEWS
// ============================================

// GET /api/admin/reviews?status=pending&page=1&limit=20
router.get('/reviews', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        console.log(`[Admin] Get Reviews - Params: status=${status}, page=${page}`);
        const query = {};
        if (status && status !== 'all') query.status = status;
        console.log(`[Admin] Get Reviews - Mongo Query:`, JSON.stringify(query));

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const total = await Review.countDocuments(query);
        const reviews = await Review.find(query)
            .populate('user', 'name avatar email')
            .populate('tour', 'title') // Populate tour title
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({ success: true, data: reviews, total });
    } catch (error) {
        console.error('Admin get reviews error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/reviews/bulk-update
router.put('/reviews/bulk-update', async (req, res) => {
    try {
        const { ids, action, reason, notify } = req.body; // action: 'approve' | 'reject'
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid IDs' });

        const updateData = {};
        if (action === 'approve') updateData.status = 'approved';
        else if (action === 'reject') {
            updateData.status = 'rejected';
            updateData.rejectionReason = reason;
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        await Review.updateMany({ _id: { $in: ids } }, updateData);

        // If approved, trigger rating recalculation for each tour affected
        // This is expensive for bulk, but necessary for correctness if hooks don't fire on updateMany
        if (action === 'approve') {
            const reviews = await Review.find({ _id: { $in: ids } }).select('tour');
            const tourIds = [...new Set(reviews.map(r => r.tour.toString()))];
            for (const tourId of tourIds) {
                await Review.calculateAverageRating(tourId);
            }
        }

        // TODO: Send notification email if notify === true

        res.json({ success: true, message: `Updated ${ids.length} reviews` });
    } catch (error) {
        console.error('Admin bulk review update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/reviews/:id
router.put('/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, action } = req.body; // editing content before approving

        const review = await Review.findById(id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        if (content) review.comment = content;
        if (action === 'approve') review.status = 'approved';
        if (action === 'reject') review.status = 'rejected';

        await review.save();
        res.json({ success: true, data: review });
    } catch (error) {
        console.error('Admin update review error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// ============================================
// MODERATION: STORIES
// ============================================

// GET /api/admin/stories?status=pending
router.get('/stories', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        console.log(`[Admin] Get Stories - Params: status=${status}, page=${page}`);
        const query = {};
        if (status && status !== 'all') {
            if (status === 'approved') query.status = 'published';
            else if (status === 'rejected') query.status = 'archived';
            else query.status = status;
        }
        console.log(`[Admin] Get Stories - Mongo Query:`, JSON.stringify(query));

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const total = await Story.countDocuments(query);
        const stories = await Story.find(query)
            .populate('author', 'name avatar email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({ success: true, data: stories, total });
    } catch (error) {
        console.error('Admin get stories error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/stories/bulk-update
router.put('/stories/bulk-update', async (req, res) => {
    try {
        const { ids, action, reason, notify } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid IDs' });

        const updateData = {};
        if (action === 'approve') updateData.status = 'published'; // Story uses 'published'
        else if (action === 'reject') {
            updateData.status = 'archived'; // Or 'rejected' if enum supports it. Model says: draft, published, archived, pending
            // Let's stick to 'archived' or 'draft' for rejection for now, or add 'rejected' to enum if needed.
            // checking model... enum: ['draft', 'published', 'archived', 'pending'].
            // 'archived' seems appropriate for rejection or soft delete.
            updateData.status = 'archived';
        }

        await Story.updateMany({ _id: { $in: ids } }, updateData);
        res.json({ success: true, message: `Updated ${ids.length} stories` });
    } catch (error) {
        console.error('Admin bulk story update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/stories/:id
router.put('/stories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, action } = req.body;

        const story = await Story.findById(id);
        if (!story) return res.status(404).json({ error: 'Story not found' });

        if (content) story.content = content;
        if (action === 'approve') story.status = 'published';

        await story.save();
        res.json({ success: true, data: story });
    } catch (error) {
        console.error('Admin update story error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// ============================================
// SERVICES MANAGEMENT
// ============================================

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

        if (!['active', 'inactive', 'pending', 'rejected'].includes(status)) {
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
