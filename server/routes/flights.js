import express from 'express';
import PartnerService from '../models/PartnerService.js';

const router = express.Router();

// GET /api/flights
router.get('/', async (req, res) => {
    try {
        const { from, to, date, maxPrice, airlines, page = 1 } = req.query;
        const query = { type: 'flight', status: 'active' };

        // 1. Search by Route (from/to)
        if (from || to) {
            if (from && to) {
                query.route = { $regex: `${from}.*${to}`, $options: 'i' };
            } else if (from) {
                query.route = { $regex: from, $options: 'i' };
            } else if (to) {
                query.route = { $regex: to, $options: 'i' };
            }
        }

        // 2. Price
        if (maxPrice) {
            query.price = { $lte: Number(maxPrice) };
        }

        // 3. Airlines (filtering by Name)
        if (airlines) {
            const airlineList = airlines.split(',');
            if (airlineList.length > 0) {
                // Case insensitive match for any of the airlines
                query.name = { $in: airlineList.map(a => new RegExp(a, 'i')) };
            }
        }

        // Pagination
        const PAGE_SIZE = 12;
        const pageNum = Math.max(1, Number(page));
        const skip = (pageNum - 1) * PAGE_SIZE;

        const total = await PartnerService.countDocuments(query);
        const flightsDb = await PartnerService.find(query)
            .skip(skip)
            .limit(PAGE_SIZE);

        // Map to IFlight-like structure
        const flights = flightsDb.map(f => {
            // Try to parse route "Code - Code" or "City - City"
            let originCode = 'HAN';
            let destCode = 'SGN';
            let originCity = 'Hà Nội';
            let destCity = 'TP Hồ Chí Minh';

            if (f.route) {
                const parts = f.route.split('-').map(s => s.trim());
                if (parts.length >= 2) {
                    originCity = parts[0];
                    destCity = parts[1];
                    originCode = originCity.substring(0, 3).toUpperCase();
                    destCode = destCity.substring(0, 3).toUpperCase();
                }
            }

            return {
                id: f._id,
                airline: f.name,
                flightNumber: `VN${Math.floor(Math.random() * 900) + 100}`,
                origin: {
                    code: originCode,
                    city: originCity,
                    time: '08:00'
                },
                destination: {
                    code: destCode,
                    city: destCity,
                    time: '10:00'
                },
                duration: '2h 00m',
                price: f.price,
                type: 'Non-stop',
                stops: req.query.stops ? Number(req.query.stops.split(',')[0]) : (Math.random() > 0.7 ? 1 : 0),
                class: req.query.classes ? req.query.classes.split(',')[0] : (Math.random() > 0.8 ? 'Business' : 'Economy'),
                date: date || new Date().toISOString().split('T')[0]
            };
        });

        return res.json({
            success: true,
            data: flights,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / PAGE_SIZE)
        });

    } catch (err) {
        console.error('Error in /api/flights:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
