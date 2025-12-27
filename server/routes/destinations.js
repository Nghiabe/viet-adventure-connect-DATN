import express from 'express';
import Destination from '../models/Destination.js';

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

        res.json({ success: true, data: destination });
    } catch (error) {
        console.error('Get Destination Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
