import express from 'express';
import PartnerService from '../models/PartnerService.js';

const router = express.Router();

// Helper to escape regex special characters
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Helper to create flexible Vietnamese regex
function createVietnameseRegex(keyword) {
    if (!keyword) return '';

    const str = keyword.toLowerCase().trim();
    let regexStr = '';

    for (let char of str) {
        if (['a', 'à', 'á', 'ạ', 'ả', 'ã', 'â', 'ầ', 'ấ', 'ậ', 'ẩ', 'ẫ', 'ă', 'ằ', 'ắ', 'ặ', 'ẳ', 'ẵ'].includes(char)) {
            regexStr += '[aàáạảãâầấậẩẫăằắặẳẵ]';
        } else if (['e', 'è', 'é', 'ẹ', 'ẻ', 'ẽ', 'ê', 'ề', 'ế', 'ệ', 'ể', 'ễ'].includes(char)) {
            regexStr += '[eèéẹẻẽêềếệểễ]';
        } else if (['i', 'ì', 'í', 'ị', 'ỉ', 'ĩ'].includes(char)) {
            regexStr += '[iìíịỉĩ]';
        } else if (['o', 'ò', 'ó', 'ọ', 'ỏ', 'õ', 'ô', 'ồ', 'ố', 'ộ', 'ổ', 'ỗ', 'ơ', 'ờ', 'ớ', 'ợ', 'ở', 'ỡ'].includes(char)) {
            regexStr += '[oòóọỏõôồốộổỗơờớợởỡ]';
        } else if (['u', 'ù', 'ú', 'ụ', 'ủ', 'ũ', 'ư', 'ừ', 'ứ', 'ự', 'ử', 'ữ'].includes(char)) {
            regexStr += '[uùúụủũưừứựửữ]';
        } else if (['y', 'ỳ', 'ý', 'ỵ', 'ỷ', 'ỹ'].includes(char)) {
            regexStr += '[yỳýỵỷỹ]';
        } else if (['d', 'đ'].includes(char)) {
            regexStr += '[dđ]';
        } else if (char === ' ') {
            regexStr += '\\s+'; // Flexible whitespace
        } else {
            regexStr += escapeRegex(char);
        }
    }
    return regexStr;
}

// GET /api/transport (Generic search for Flight, Train, Bus)
router.get('/', async (req, res) => {
    try {
        const { type, from, to, date, page = 1 } = req.query;

        // Validate type
        if (!type || !['flight', 'train', 'bus'].includes(type)) {
            if (!type) {
                return res.status(400).json({ success: false, error: 'Transport type is required (flight, train, bus)' });
            }
        }

        const query = { type, status: 'active' };

        // Route matching with flexible Vietnamese regex
        if (from || to) {
            if (from && to) {
                // Create flexible regex for both parts
                const fromRegex = createVietnameseRegex(from);
                const toRegex = createVietnameseRegex(to);
                // Match "from ... to" with any characters in between
                query.route = { $regex: `${fromRegex}.*${toRegex}`, $options: 'i' };
            } else if (from) {
                query.route = { $regex: createVietnameseRegex(from), $options: 'i' };
            } else if (to) {
                query.route = { $regex: createVietnameseRegex(to), $options: 'i' };
            }
        }

        const PAGE_SIZE = 20;
        const pageNum = Math.max(1, Number(page));
        const skip = (pageNum - 1) * PAGE_SIZE;

        const total = await PartnerService.countDocuments(query);
        const servicesDb = await PartnerService.find(query)
            .skip(skip)
            .limit(PAGE_SIZE);

        const services = servicesDb.map(s => {
            // Parse Route
            let depLoc = from || 'Điểm đi';
            let arrLoc = to || 'Điểm đến';
            if (s.route) {
                const parts = s.route.split('-').map(p => p.trim());
                if (parts.length >= 2) {
                    depLoc = parts[0];
                    arrLoc = parts[1];
                }
            }

            return {
                id: s._id,
                operator: s.name,
                logo: s.image,
                type: s.type, // flight, train, bus
                departure: {
                    time: '08:00', // Mock
                    station: depLoc,
                    airport: depLoc // for flight compatibility
                },
                arrival: {
                    time: '12:00', // Mock
                    station: arrLoc,
                    airport: arrLoc
                },
                duration: '4h 00m', // Mock
                price: s.price,
                class: 'Standard',
                raw: s
            };
        });

        return res.json({
            success: true,
            data: services,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / PAGE_SIZE)
        });

    } catch (err) {
        console.error('Error in /api/transport:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
