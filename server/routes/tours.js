import express from 'express';
import Tour from '../models/Tour.js';
import Destination from '../models/Destination.js'; // Import if needed for population reference check

const router = express.Router();

// GET /api/tours (List/Search)
router.get('/', async (req, res) => {
    try {
        const { query, destination, minPrice, maxPrice, duration, sort, page = 1, limit = 10 } = req.query;

        const filter = { status: 'published' }; // Default to published only for public API

        // Text Search
        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }

        // Destination Filter
        if (destination) {
            // Can be ID or slug, but usually ID from frontend filters. 
            // If slug passed, we might need to look up destination first.
            // Assuming ID for now based on standard filter behavior.
            filter.destination = destination;
        }

        // Price Filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Duration Filter (Exact match string or range if parsed - keeping simple)
        if (duration) {
            filter.duration = { $regex: duration, $options: 'i' };
        }

        // Pagination
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        // Sorting
        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        if (sort === 'price_desc') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { averageRating: -1 };

        const total = await Tour.countDocuments(filter);
        const tours = await Tour.find(filter)
            .populate('destination', 'name slug')
            .populate('owner', 'name avatar')
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum)
            .lean();

        res.json({
            success: true,
            data: tours,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('List Tours Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch tours' });
    }
});

// GET /api/tours/:id (Detail)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const tour = await Tour.findById(id)
            .populate('destination', 'name slug description mainImage')
            .populate('owner', 'name avatar email') // Populate owner info for contact/chat
            .lean();

        if (!tour) {
            return res.status(404).json({ success: false, error: 'Tour not found' });
        }

        res.json({ success: true, data: tour });
    } catch (error) {
        console.error('Get Tour Detail Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch tour detail' });
    }
});

export default router;
