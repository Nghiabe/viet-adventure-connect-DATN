import express from 'express';
import Destination from '../models/Destination.js';
import Tour from '../models/Tour.js';
import Story from '../models/Story.js';

const router = express.Router();

// GET /api/destinations/lookup
// Used for looking up destinations by IDs (e.g. for itinerary builder)
router.get('/lookup', async (req, res) => {
    try {
        const idsParam = req.query.ids;
        const ids = (idsParam || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        if (!ids.length) {
            return res.json({ success: true, data: [] });
        }

        const docs = await Destination.find({ _id: { $in: ids } }).lean();
        res.json({ success: true, data: docs });
    } catch (error) {
        console.error('Destination Lookup Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/destinations/:slug (Get detail by slug)
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const destination = await Destination.findOne({ slug }).lean();

        if (!destination) {
            return res.status(404).json({ success: false, error: 'Destination not found' });
        }

        // Fetch associated tours
        const tours = await Tour.find({ destination: destination._id, status: 'published' })
            .select('title price duration averageRating reviewCount isSustainable mainImage')
            .limit(10)
            .lean();

        // Fetch associated stories
        const stories = await Story.find({ destination: destination._id, status: 'approved' })
            .select('title coverImage author createdAt')
            .populate('author', 'name avatar')
            .limit(6)
            .lean();

        res.json({
            success: true,
            data: {
                destination,
                associatedTours: tours,
                associatedStories: stories
            }
        });
    } catch (error) {
        console.error('Get Destination Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
