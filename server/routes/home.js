import express from 'express';
import Destination from '../models/Destination.js';
import Tour from '../models/Tour.js';

const router = express.Router();

// GET /api/home/featured-destinations
router.get('/featured-destinations', async (req, res) => {
    try {
        // Logic: Fetch top 6 destinations, sorted by newest for now
        const destinations = await Destination.find({}).sort({ createdAt: -1 }).limit(6).lean();
        res.json({ success: true, data: destinations });
    } catch (error) {
        console.error('Featured Destinations Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch featured destinations' });
    }
});

// GET /api/home/featured-tours
router.get('/featured-tours', async (req, res) => {
    try {
        // Logic: Fetch top 6 tours, sorted by average rating
        const tours = await Tour.find({})
            .sort({ averageRating: -1, reviewCount: -1, createdAt: -1 })
            .limit(6)
            // Populate destination to get name and slug
            .populate('destination', 'name slug')
            .lean();

        res.json({ success: true, data: tours });
    } catch (error) {
        console.error('Featured Tours Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch featured tours' });
    }
});

export default router;
