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

export default router;
