import express from 'express';
import PartnerService from '../models/PartnerService.js';

const router = express.Router();

// GET /api/hotels (List/Search)
router.get('/', async (req, res) => {
    try {
        const {
            city,
            minPrice,
            maxPrice,
            ratings,
            amenities,
            sortBy,
            page = 1,
            per_page = 20
        } = req.query;

        const query = { type: 'hotel', status: 'active' };

        // 1. Filter by City
        if (city) {
            // Case-insensitive regex search
            query.$or = [
                { city: { $regex: city, $options: 'i' } },
                { location: { $regex: city, $options: 'i' } },
                { address: { $regex: city, $options: 'i' } },
                { name: { $regex: city, $options: 'i' } }
            ];
        }

        // 2. Filter by Price
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // 3. Filter by Rating (0-5 scale or stars)
        if (ratings) {
            const ratingValues = ratings.split(',').map(Number);
            if (ratingValues.length > 0) {
                const minRating = Math.min(...ratingValues);
                query.rating = { $gte: minRating };
            }
        }

        // 4. Filter by Amenities (mapped to facilities)
        if (amenities) {
            const amenityList = amenities.split(',');
            if (amenityList.length > 0) {
                query.facilities = { $all: amenityList };
            }
        }

        // Pagination
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(per_page)));
        const skip = (pageNum - 1) * limitNum;

        // Sorting
        let sort = {};
        if (sortBy === 'price_asc') sort.price = 1;
        else if (sortBy === 'price_desc') sort.price = -1;
        else if (sortBy === 'rating_desc') sort.rating = -1;
        else sort.createdAt = -1;

        // Execution
        const total = await PartnerService.countDocuments(query);
        const hotelsDb = await PartnerService.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Format for frontend (matching IHotel interface)
        const hotels = hotelsDb.map(h => ({
            id: h._id,
            name: h.name,
            location: h.location || h.address || '',
            imageUrl: h.image || (h.images && h.images[0]) || 'https://picsum.photos/seed/hotel-fallback/800/600',
            rating: h.rating,
            reviewCount: 0, // Not strictly in PartnerService yet
            amenities: h.facilities || [],
            // Price fields
            priceNumber: h.price,
            price: { amount: h.price, currency: 'VND' },
            // Detail fields
            images: h.images && h.images.length ? h.images.map(url => ({ url })) : [{ url: h.image }],
            description: h.description,
            raw: h
        }));

        return res.json({
            hotels,
            count: total,
            page: pageNum,
            per_page: limitNum,
            total_pages: Math.ceil(total / limitNum)
        });

    } catch (err) {
        console.error('Error in /api/hotels:', err);
        return res.status(500).json({ hotels: [], count: 0, error: err.message });
    }
});

// GET /api/hotels/:id (Detail)
router.get('/:id', async (req, res) => {
    try {
        const hotelId = req.params.id;
        if (!hotelId) return res.status(400).json({ error: 'Missing hotel id' });

        const hotel = await PartnerService.findById(hotelId);
        if (!hotel || hotel.type !== 'hotel') {
            return res.status(404).json({ error: "Hotel not found" });
        }

        // Format response
        const result = {
            id: hotel._id,
            name: hotel.name,
            location: hotel.location || hotel.address,
            imageUrl: hotel.image || (hotel.images && hotel.images[0]) || '',
            rating: hotel.rating,
            reviewCount: 0,
            amenities: hotel.facilities || [],
            description: hotel.description,
            images: hotel.images && hotel.images.length ? hotel.images.map(url => ({ url })) : [{ url: hotel.image }],

            // Pricing
            priceNumber: hotel.price,
            priceVndNumber: hotel.price,
            priceDisplay: `${hotel.price.toLocaleString('vi-VN')} ₫`,
            finalPriceDisplay: `${hotel.price.toLocaleString('vi-VN')} ₫`,

            raw: hotel
        };

        return res.json(result);

    } catch (err) {
        console.error('[DETAIL] Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

export default router;
