import express from 'express';
import mongoose from 'mongoose';
import Tour from '../models/Tour.js';
import Destination from '../models/Destination.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import PartnerService from '../models/PartnerService.js';

import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all partner routes (or selectively)
// router.use(requireAuth); 

// --- Routes ---

// GET /api/partner/destinations
router.get('/destinations', async (req, res) => {
    try {
        const destinations = await Destination.find({ status: 'published' }).sort({ name: 1 }).lean();
        res.json({ success: true, data: destinations });
    } catch (error) {
        console.error('Error fetching destinations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('partnerProfile name avatar email');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Return combined data: partnerProfile + fallback to user basics
        const profile = {
            companyName: user.partnerProfile?.companyName || user.name,
            description: user.partnerProfile?.description || '',
            website: user.partnerProfile?.website || '',
            phoneNumber: user.partnerProfile?.phoneNumber || '',
            address: user.partnerProfile?.address || '',
            logo: user.partnerProfile?.logo || user.avatar
        };

        res.json({ success: true, data: profile });
    } catch (error) {
        console.error('Error fetching partner profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/partner/profile
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { companyName, description, website, phoneNumber, address, logo } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Update partnerProfile
        user.partnerProfile = {
            companyName,
            description,
            website,
            phoneNumber,
            address,
            logo
        };

        // Optionally update main name/avatar if they are empty or per business logic
        // For now, let's keep them separate but synced if needed. 
        // Logic: if partner name changes, maybe user name should too? 
        // Let's just save the specific profile data.

        await user.save();

        res.json({ success: true, data: user.partnerProfile });
    } catch (error) {
        console.error('Error updating partner profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/settings
router.get('/settings', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('partnerProfile');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const settings = {
            bankName: user.partnerProfile?.bankName || '',
            bankAccountName: user.partnerProfile?.bankAccountName || '',
            bankAccountNumber: user.partnerProfile?.bankAccountNumber || '',
            emailNotifications: user.partnerProfile?.emailNotifications ?? true,
            bookingAlerts: user.partnerProfile?.bookingAlerts ?? true
        };

        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Error fetching partner settings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/partner/settings
router.put('/settings', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bankName, bankAccountName, bankAccountNumber, emailNotifications, bookingAlerts } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Initialize partnerProfile if it doesn't exist
        if (!user.partnerProfile) user.partnerProfile = {};

        // Update settings fields
        if (bankName !== undefined) user.partnerProfile.bankName = bankName;
        if (bankAccountName !== undefined) user.partnerProfile.bankAccountName = bankAccountName;
        if (bankAccountNumber !== undefined) user.partnerProfile.bankAccountNumber = bankAccountNumber;
        if (emailNotifications !== undefined) user.partnerProfile.emailNotifications = emailNotifications;
        if (bookingAlerts !== undefined) user.partnerProfile.bookingAlerts = bookingAlerts;

        await user.save();

        res.json({
            success: true,
            data: {
                bankName: user.partnerProfile.bankName,
                bankAccountName: user.partnerProfile.bankAccountName,
                bankAccountNumber: user.partnerProfile.bankAccountNumber,
                emailNotifications: user.partnerProfile.emailNotifications,
                bookingAlerts: user.partnerProfile.bookingAlerts
            }
        });
    } catch (error) {
        console.error('Error updating partner settings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { range = '30d' } = req.query;

        // Date filter
        const now = new Date();
        const past = new Date();
        if (range === '7d') past.setDate(now.getDate() - 7);
        else if (range === '1y') past.setFullYear(now.getFullYear() - 1);
        else past.setDate(now.getDate() - 30); // Default 30d

        // 1. Fetch Owner's Tours
        const tours = await Tour.find({ owner: userId }).lean();
        const tourIds = tours.map(t => t._id);

        // 2. Fetch Bookings for these tours
        const bookings = await Booking.find({
            tour: { $in: tourIds },
            createdAt: { $gte: past }
        })
            .populate('user', 'name email')
            .populate('tour', 'title')
            .sort({ createdAt: -1 })
            .lean();

        // 3. Calculate KPIs
        const totalTours = tours.length;
        const publishedTours = tours.filter(t => t.status === 'published').length;

        const totalBookings = bookings.length;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;

        const totalRevenue = bookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        const totalReviews = tours.reduce((sum, t) => sum + (t.reviewCount || 0), 0);
        // Average rating weighted by review count would be ideal, but simple average of tours is okay for MVP
        const ratedTours = tours.filter(t => t.averageRating > 0);
        const averageRating = ratedTours.length > 0
            ? (ratedTours.reduce((sum, t) => sum + t.averageRating, 0) / ratedTours.length).toFixed(1)
            : 0;

        // 4. Monthly Revenue (Simple aggregation for chart)
        // Group bookings by month-year
        const revenueMap = {};
        bookings.forEach(b => {
            if (b.status !== 'confirmed') return;
            const d = new Date(b.createdAt);
            const key = `${d.getMonth() + 1}-${d.getFullYear()}`; // 12-2025
            if (!revenueMap[key]) revenueMap[key] = 0;
            revenueMap[key] += b.totalPrice || 0;
        });

        const monthlyRevenue = Object.entries(revenueMap).map(([key, value]) => {
            const [month, year] = key.split('-');
            return { _id: { month: parseInt(month), year: parseInt(year) }, revenue: value, bookings: 0 }; // simplified
        });

        // 5. Recent Bookings (Limit 5)
        const recentBookings = bookings.slice(0, 5);

        res.json({
            success: true,
            data: {
                kpis: {
                    totalTours,
                    publishedTours,
                    totalBookings,
                    confirmedBookings,
                    totalRevenue,
                    averageRating: parseFloat(averageRating),
                    totalReviews
                },
                recentBookings,
                monthlyRevenue,
                tours: tours.slice(0, 5) // Return a few tours for the list
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/tours (My Tours)
router.get('/tours', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { status, search, page = 1, limit = 10 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query = { owner: userId };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await Tour.countDocuments(query);

        // Fetch paginated tours
        const tours = await Tour.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Calculate total pages
        const pages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            data: tours,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages
            }
        });
    } catch (error) {
        console.error('Error fetching tours:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/tours/:id
router.get('/tours/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (id === 'new') return res.json({ success: true, data: {} });

        const tour = await Tour.findById(id).lean();
        if (!tour) return res.status(404).json({ success: false, error: 'Tour not found' });

        // Populate destination if needed, or rely on stored buffer
        // For editor, we need it to look standard.
        // If legacy 'destination' field exists but 'destinations' empty, fix it
        if (tour.destination && (!tour.destinations || tour.destinations.length === 0)) {
            const d = await Destination.findById(tour.destination);
            tour.destinations = [{
                destinationId: tour.destination,
                orderIndex: 1,
                destinationName: d ? d.name : ''
            }];
        }

        res.json({ success: true, data: tour });
    } catch (error) {
        console.error('Error fetching tour:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/partner/tours
router.post('/tours', requireAuth, async (req, res) => {
    try {
        const body = req.body;
        // Basic validation
        if (!body.title) return res.status(400).json({ success: false, error: 'Title is required' });

        // Handle legacy 'destination' field if not present in body but 'destinations' is
        if (!body.destination && body.destinations && body.destinations.length > 0) {
            body.destination = body.destinations[0].destinationId;
        }

        const newTour = await Tour.create({
            ...body,
            owner: req.user.userId // Enforce owner from token
        });
        res.json({ success: true, data: newTour });
    } catch (error) {
        console.error('Error create tour:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/partner/tours/:id
router.put('/tours/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const userId = req.user.userId;

        if (!body.destination && body.destinations && body.destinations.length > 0) {
            body.destination = body.destinations[0].destinationId;
        }

        // Ensure user owns the tour before updating
        const existingTour = await Tour.findOne({ _id: id, owner: userId });
        if (!existingTour) {
            return res.status(404).json({ success: false, error: 'Tour not found or unauthorized' });
        }

        const updated = await Tour.findByIdAndUpdate(id, body, { new: true });
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error update tour:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/partner/tours/:id
router.delete('/tours/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const deleted = await Tour.findOneAndDelete({ _id: id, owner: userId });
        if (!deleted) return res.status(404).json({ success: false, error: 'Tour not found or unauthorized' });

        res.json({ success: true, data: { message: 'Tour deleted' } });
    } catch (error) {
        console.error('Error delete tour:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/bookings
router.get('/bookings', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, status, search, tourId, startDate, endDate } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // 1. Find all tours AND services owned by this partner
        const [tours, services] = await Promise.all([
            Tour.find({ owner: userId }).select('_id'),
            PartnerService.find({ owner: userId }).select('_id')
        ]);

        const tourIds = tours.map(t => t._id);
        const serviceIds = services.map(s => s._id);

        if (tourIds.length === 0 && serviceIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    bookings: [],
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: 0,
                        pages: 0
                    }
                }
            });
        }

        // 2. Build Query
        const query = {
            $or: [
                { tour: { $in: tourIds } },
                { partnerService: { $in: serviceIds } }
            ]
        };

        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by specific product (tour OR service)
        // Reusing 'tourId' param for generic 'productId' or checking against both
        if (tourId && tourId !== 'all') {
            // Check if it's a tour or service owned by user
            const isMyTour = tourIds.some(id => id.toString() === tourId);
            const isMyService = serviceIds.some(id => id.toString() === tourId);

            if (isMyTour) {
                query.tour = tourId;
                delete query.$or; // Specific filter overrides the general OR
            } else if (isMyService) {
                query.partnerService = tourId;
                delete query.$or;
            } else {
                // Not owned
                query.tour = null;
                query.partnerService = null;
                delete query.$or;
            }
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const users = await User.find({
                $or: [{ name: searchRegex }, { email: searchRegex }]
            }).select('_id');
            const userIds = users.map(u => u._id);

            // Wrap existing query in $and so search is applied ON TOP of ownership/filter
            const baseQuery = { ...query };

            // Clean up base properties that we moved to $and
            // (Actually keeping them is fine if we use $and correctly, but let's be cleaner)
            // Simpler approach: Add the search conditions to the query object

            query.$and = [
                // 1. Ownership/Filter logic from above
                // If we had $or for ownership, it needs to be preserved.
                // If we had specific tour/service filter, it needs to be preserved.
                // Implementation detail: constructing a new query object is safer.
            ];

            // It's getting complicated to mutate `query` in place with potential existing $or
            // Let's rebuild the ownership part inside $and if search is present,
            // or just add search criteria.

            /* 
               We need: 
               ( (Tour IN myTours) OR (Service IN myServices) ) 
               AND (Status == ...)
               AND (Date == ...)
               AND ( (Title regex) OR (User regex) )
            */

            // We already built `query` with the ownership/status/date parts.
            // However, `query` might have an `$or` (for ownership).
            // If we add another `$or` (for search), it will conflict/overwrite (keys must be unique).
            // So we must use `$and` to combine them.

            const searchQuery = {
                $or: [
                    { 'serviceInfo.title': searchRegex },
                    { 'tourInfo.title': searchRegex }, // Legacy support
                    { user: { $in: userIds } }
                ]
            };

            // If query already has $or (ownership), we must move it to $and or merge
            if (query.$or) {
                // Ownership $or exists
                query.$and = [
                    { $or: query.$or },
                    searchQuery
                ];
                delete query.$or;
            } else {
                // specific product selected, so no ownership $or
                query.$and = [searchQuery];
            }
        }

        // 3. Execute with Populate
        const total = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .populate('user', 'name email')
            .populate('tour', 'title duration price')
            .populate('partnerService', 'name price type')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        const pages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            data: {
                bookings,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages
                }
            }
        });

    } catch (error) {
        console.error('Error fetching partner bookings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/bookings/:id
router.get('/bookings/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const booking = await Booking.findById(id)
            .populate('user', 'name email avatar')
            .populate('tour', 'title owner')
            .populate('partnerService', 'name type owner')
            .lean();

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // Verify ownership
        let ownerId = null;
        if (booking.tour) {
            ownerId = booking.tour.owner; // Populated above
        } else if (booking.partnerService) {
            ownerId = booking.partnerService.owner; // Populated above
        }

        // Fallback checks if population failed or structured differently
        if (!ownerId && booking.tour) {
            const t = await Tour.findById(booking.tour);
            if (t) ownerId = t.owner;
        }
        if (!ownerId && booking.partnerService) {
            const s = await PartnerService.findById(booking.partnerService);
            if (s) ownerId = s.owner;
        }

        if (!ownerId || ownerId.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        console.error('Error fetching booking detail:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/partner/bookings/:id/status
router.put('/bookings/:id/status', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;

        if (!['confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        // 1. Find the booking
        const booking = await Booking.findById(id).populate('tour');
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // 2. Verify ownership: The partner must own the tour OR service associated with this booking
        let ownerId = null;

        if (booking.tour) {
            // Check tour ownership
            let tour = booking.tour;
            if (!tour.owner) { // Not populated or just ID
                tour = await Tour.findById(booking.tour);
            }
            if (tour) ownerId = tour.owner;
        } else if (booking.partnerService) {
            // Check partner service ownership
            let service = booking.partnerService;
            // Ensure we have the full object or fetch it (PartnerService model logic)
            if (!service.owner) {
                service = await PartnerService.findById(booking.partnerService);
            }
            if (service) ownerId = service.owner;
        }

        if (!ownerId || ownerId.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized to manage this booking' });
        }

        // 3. Update Status
        booking.status = status;

        // Add history entry
        booking.history.push({
            action: `status_change`,
            by: userId,
            note: `Partner changed status to ${status}`
        });

        await booking.save();

        res.json({ success: true, data: booking });

    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/marketing/coupons
router.get('/marketing/coupons', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const coupons = await Coupon.find({ owner: userId }).sort({ createdAt: -1 }).lean();
        res.json({ success: true, data: coupons });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/partner/marketing/coupons
router.post('/marketing/coupons', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { code, discountType, discountValue, limit, expiry } = req.body;

        if (!code || !discountValue) {
            return res.status(400).json({ success: false, error: 'Code and discount value are required' });
        }

        // Check if code exists
        const existing = await Coupon.findOne({ code });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Mã giảm giá đã tồn tại' });
        }

        const newCoupon = await Coupon.create({
            code,
            discountType: discountType || 'percentage',
            discountValue: Number(discountValue),
            limits: { totalUses: Number(limit) || 0 },
            endDate: expiry,
            startDate: new Date(),
            owner: userId,
            isActive: true
        });

        res.json({ success: true, data: newCoupon });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/partner/marketing/coupons/:id
router.put('/marketing/coupons/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { code, discountType, discountValue, limit, expiry, isActive } = req.body;

        // Verify ownership and existence
        const coupon = await Coupon.findOne({ _id: id, owner: userId });
        if (!coupon) {
            return res.status(404).json({ success: false, error: 'Coupon not found or unauthorized' });
        }

        // Update fields
        if (code) coupon.code = code;
        if (discountType) coupon.discountType = discountType;
        if (discountValue) coupon.discountValue = Number(discountValue);
        if (limit !== undefined) coupon.limits.totalUses = Number(limit);
        if (expiry) coupon.endDate = expiry;
        if (isActive !== undefined) coupon.isActive = isActive;

        await coupon.save();

        res.json({ success: true, data: coupon });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/partner/marketing/coupons/:id
router.delete('/marketing/coupons/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const deleted = await Coupon.findOneAndDelete({ _id: id, owner: userId });
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Coupon not found or unauthorized' });
        }

        res.json({ success: true, data: { message: 'Coupon deleted' } });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/analytics/overview
router.get('/analytics/overview', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate } = req.query;

        // 1. Validate Dates
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        // Ensure end date includes the full day
        end.setHours(23, 59, 59, 999);

        // 2. Find Partner's Tours
        const tours = await Tour.find({ owner: userId }).select('_id');
        const tourIds = tours.map(t => t._id);

        // 3. Find Bookings in Range
        const bookings = await Booking.find({
            tour: { $in: tourIds },
            createdAt: { $gte: start, $lte: end },
            status: 'confirmed' // Only count confirmed bookings for revenue
        }).lean();

        // 4. Calculate KPIs
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const totalBookings = bookings.length;

        // Unique customers
        const uniqueCustomers = new Set(bookings.map(b => b.user ? b.user.toString() : null).filter(Boolean)).size;

        // 5. Aggregate for Charts (Daily)
        const dailyMap = new Map();

        // Initialize map with all days in range (optional but good for charts)
        // For simplicity, we'll just map existing bookings and let frontend handle gaps or just show data points.
        // But better to have gaps filled ideally. Let's return raw booking points aggregated by day.

        bookings.forEach(b => {
            const dateStr = new Date(b.createdAt).toLocaleDateString('vi-VN'); // or simplified YYYY-MM-DD
            // Use simple YYYY-MM-DD for sorting/storage
            const d = new Date(b.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            if (!dailyMap.has(key)) {
                dailyMap.set(key, { name: key, revenue: 0, bookings: 0 });
            }
            const entry = dailyMap.get(key);
            entry.revenue += (b.totalPrice || 0);
            entry.bookings += 1;
        });

        // Convert to array and sort by date
        const revAgg = Array.from(dailyMap.values()).sort((a, b) => a.name.localeCompare(b.name)).map(item => ({
            _id: item.name,
            revenue: item.revenue,
            bookings: item.bookings
        }));

        // KPI Array structure matching frontend expectation: 
        // const kpis = data?.kpis || [{ revenue: 0, bookings: 0 }, 0];
        // const [totalStats, newCustomersCount] = Array.isArray(kpis) ...
        // So backend should return [ { revenue, bookings }, uniqueCustomers ]

        const kpis = [
            { revenue: totalRevenue, bookings: totalBookings },
            uniqueCustomers
        ];

        res.json({
            success: true,
            data: {
                revAgg,
                kpis
            }
        });

    } catch (error) {
        console.error('Error in partner analytics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/reviews
router.get('/reviews', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, search, status, rating } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // 1. Get all tours owned by partner
        const tours = await Tour.find({ owner: userId }).select('_id');
        const tourIds = tours.map(t => t._id);

        if (tourIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    reviews: [],
                    pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
                    stats: {
                        averageRating: 0,
                        totalReviews: 0,
                        distribution: { five: 0, four: 0, three: 0, two: 0, one: 0 }
                    }
                }
            });
        }

        // 2. Build Query
        const query = { tour: { $in: tourIds } };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (rating && rating !== 'all') {
            query.rating = Number(rating);
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');

            // Find users matching search
            const users = await User.find({
                $or: [{ name: searchRegex }, { email: searchRegex }]
            }).select('_id');
            const matchedUserIds = users.map(u => u._id);

            // Find tours matching title (within partner's tours)
            const matchedTours = await Tour.find({
                _id: { $in: tourIds },
                title: searchRegex
            }).select('_id');
            const matchedTourIds = matchedTours.map(t => t._id);

            query.$or = [
                { user: { $in: matchedUserIds } },
                { tour: { $in: matchedTourIds } }
            ];
        }

        // 3. Stats (Calculate on ALL matching reviews for this partner)
        const globalQuery = { tour: { $in: tourIds } };

        // Execute queries
        const [total, reviews, allReviewsForStats] = await Promise.all([
            Review.countDocuments(query),
            Review.find(query)
                .populate('user', 'name email avatar')
                .populate('tour', 'title')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Review.find(globalQuery).select('rating').lean()
        ]);

        // Calculate Stats
        const totalReviews = allReviewsForStats.length;
        const totalRating = allReviewsForStats.reduce((sum, r) => sum + (r.rating || 0), 0);
        const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;

        const distribution = { five: 0, four: 0, three: 0, two: 0, one: 0 };
        allReviewsForStats.forEach(r => {
            if (r.rating === 5) distribution.five++;
            else if (r.rating === 4) distribution.four++;
            else if (r.rating === 3) distribution.three++;
            else if (r.rating === 2) distribution.two++;
            else if (r.rating === 1) distribution.one++;
        });

        // 4. Response
        const pages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages
                },
                stats: {
                    averageRating: Number(averageRating),
                    totalReviews,
                    distribution
                }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Partner Services (Hotel, Flight, Train, Bus) ---

// GET /api/partner/services
router.get('/services', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type } = req.query;

        const query = { owner: userId };
        if (type && type !== 'all') {
            query.type = type;
        }

        const services = await PartnerService.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: services });
    } catch (error) {
        console.error('Error fetching partner services:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/partner/services/:id
router.get('/services/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const service = await PartnerService.findOne({ _id: id, owner: userId });
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        res.json({ success: true, data: service });
    } catch (error) {
        console.error('Error fetching service detail:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/partner/services
router.post('/services', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const body = req.body;

        if (!body.name || !body.type || !body.price) {
            return res.status(400).json({ success: false, error: 'Name, type and price are required' });
        }

        const newService = await PartnerService.create({
            ...body,
            owner: userId,
            // Allow override but default to active
            status: body.status || 'active',
            // Default rating if not provided (though usually starts at 0 or 5 depending on logic, let's say 0 or 5 if you want them to look good initially)
            rating: body.rating || 4.5
        });

        res.json({ success: true, data: newService });
    } catch (error) {
        console.error('Error creating partner service:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/partner/services/:id
router.put('/services/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const updates = req.body;

        const service = await PartnerService.findOneAndUpdate(
            { _id: id, owner: userId },
            updates,
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found or unauthorized' });
        }

        res.json({ success: true, data: service });
    } catch (error) {
        console.error('Error updating partner service:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/partner/services/:id
router.delete('/services/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const deleted = await PartnerService.findOneAndDelete({ _id: id, owner: userId });

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Service not found or unauthorized' });
        }

        res.json({ success: true, data: { message: 'Service deleted' } });
    } catch (error) {
        console.error('Error deleting partner service:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
