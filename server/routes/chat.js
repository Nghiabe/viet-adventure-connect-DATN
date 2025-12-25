import express from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Booking from '../models/Booking.js';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Story from '../models/Story.js';

const router = express.Router();
import Tour from '../models/Tour.js';
import PartnerService from '../models/PartnerService.js';

// POST /api/chat/inquiry - Start chat for a specific tour (creates provisional booking)
router.post('/inquiry', requireAuth, async (req, res) => {
    try {
        const { tourId, transportData, storyId } = req.body;
        const userId = req.user.userId;

        if (!tourId && !transportData && !storyId) return res.status(400).json({ error: 'Tour ID, Transport Data, or Story ID is required' });

        // 1. Check if ANY active booking exists (provisional, pending, confirmed) for this Context + User
        let query = { user: userId, status: { $in: ['provisional', 'pending', 'confirmed'] } };

        if (tourId) {
            query.tour = tourId;
        } else if (storyId) {
            query.story = storyId;
        } else if (transportData) {
            // For transport, we can check by a unique identifier if we have one (e.g. transportNumber)
            // Or just check if we have a provisional booking with the same service info title/time
            query['serviceInfo.title'] = transportData.title;
            query['serviceInfo.bookingDate'] = transportData.bookingDate;
        }

        let booking = await Booking.findOne(query).sort({ createdAt: -1 }); // Get most recent

        // 2. If no booking, create a PROVISIONAL one
        if (!booking) {
            if (tourId) {
                const tour = await Tour.findById(tourId);
                if (!tour) return res.status(404).json({ error: 'Tour not found' });

                // Create provisional booking for Tour
                booking = new Booking({
                    user: userId,
                    tour: tourId,
                    type: 'tour',
                    status: 'provisional',
                    participants: 1, // Default
                    totalPrice: tour.price || 0, // Default base price
                    serviceInfo: {
                        title: tour.title,
                        price: tour.price,
                        image: tour.images?.[0]?.url || tour.mainImage || '',
                        destination: tour.destination?.name || 'Vietnam',
                        duration: tour.duration
                    },
                    contactInfo: { name: 'Tour Inquiry', email: '', phone: '' }
                });
            } else if (storyId) {
                const story = await Story.findById(storyId).populate('author', 'name avatar');
                if (!story) return res.status(404).json({ error: 'Story not found' });

                // Create provisional booking for Story (Context)
                booking = new Booking({
                    user: userId,
                    story: storyId,
                    type: 'story',
                    status: 'provisional',
                    participants: 1,
                    totalPrice: 0, // Stories don't have a price usually
                    serviceInfo: {
                        title: story.title,
                        price: 0,
                        image: story.coverImage || '',
                        destination: 'Story Discussion',
                    },
                    contactInfo: { name: 'Story Chat', email: '', phone: '' }
                });


            } else if (transportData) {
                // Create provisional booking for Transport
                booking = new Booking({
                    user: userId,
                    // No 'tour' or 'partnerService' reference for external transport API usually, 
                    // unless we have a PartnerService model for it. For now, standalone.
                    type: transportData.type || 'flight',
                    status: 'provisional',
                    participants: transportData.passengers || 1,
                    totalPrice: transportData.totalPrice || 0,
                    serviceInfo: {
                        title: transportData.title,
                        price: transportData.unitPrice,
                        image: transportData.image || '', // Add a generic transport image if needed
                        destination: transportData.destination,
                        checkIn: transportData.departureTime ? new Date(transportData.departureTime) : undefined,
                        // Add other transport specific fields to serviceInfo snapshot
                        location: `${transportData.originCode} - ${transportData.destinationCode}`,
                        tripTime: transportData.duration,
                        airline: transportData.operator // operator/airline
                    },
                    contactInfo: { name: 'Transport Inquiry', email: '', phone: '' }
                });
            }

            await booking.save();
        }

        // 3. Get or Create Conversation for this booking
        // The existing logic inside getConversation will handle conversation creation
        // We just need to ensure the booking exists (which we did above)
        const conversation = await getConversation(booking._id, userId);

        res.json({
            success: true,
            data: {
                conversationId: conversation._id,
                bookingId: booking._id
            }
        });

    } catch (err) {
        console.error('Error in chat inquiry:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper to find or create conversation
const getConversation = async (bookingId, userId) => {
    let conversation = await Conversation.findOne({ booking: bookingId })
        .populate('booking')
        .populate({
            path: 'booking',
            populate: [
                { path: 'tour', populate: { path: 'owner' } },
                { path: 'partnerService', populate: { path: 'owner' } },
                { path: 'story', populate: { path: 'author' } }
            ]
        });

    if (conversation) {
        // Self-Healing: Ensure current user is in participants if they are the owner/provider
        const booking = conversation.booking;
        let providerId;
        if (booking.tour?.owner?._id) providerId = booking.tour.owner._id;
        else if (booking.tour?.owner) providerId = booking.tour.owner; // ID only
        else if (booking.story?.author?._id) providerId = booking.story.author._id;
        else if (booking.story?.author) providerId = booking.story.author; // ID only
        else if (booking.partnerService?.owner?._id) providerId = booking.partnerService.owner._id;
        else if (booking.partnerService?.owner) providerId = booking.partnerService.owner; // ID only

        if (providerId) {
            const providerIdStr = providerId.toString();
            const isParticipant = conversation.participants.some(p => p.toString() === providerIdStr);

            // If I am the provider requesting this, or if provider is missing, we should probably add them.
            // But we only have userId here. Let's just check if userId matches providerId and is NOT in participants.
            if (userId === providerIdStr && !isParticipant) {
                console.log(`[Auto-Fix] Adding provider ${userId} to conversation ${conversation._id}`);
                conversation.participants.push(userId);
                await conversation.save();
            }
        }
    }

    if (!conversation) {
        // Create new conversation
        const booking = await Booking.findById(bookingId)
            .populate('tour')
            .populate('story')
            .populate('partnerService');

        if (!booking) throw new Error('Booking not found');

        // Identify provider
        let providerId;
        if (booking.tour?.owner) providerId = booking.tour.owner;
        else if (booking.story?.author) providerId = booking.story.author;
        else if (booking.partnerService?.owner) providerId = booking.partnerService.owner;

        if (!providerId) {
            console.warn(`Provider not found for booking ${bookingId}. Using fallback.`);
            // Only use fallback if we really have to. Ideally we shouldn't create a broken conversation.
            // But preserving old logic for now or finding Admin
            const fallbackUser = await User.findOne({ role: 'admin' });
            if (fallbackUser) providerId = fallbackUser._id;
            else {
                // Try any user if no admin (dev env)
                const anyUser = await User.findOne();
                if (anyUser) providerId = anyUser._id;
            }
        }

        // Ensure participants include user and provider
        const participants = [booking.user];
        if (providerId) participants.push(providerId);

        // Deduplicate
        const uniqueParticipants = [...new Set(participants.map(p => p.toString()))];

        conversation = new Conversation({
            booking: bookingId,
            participants: uniqueParticipants,
            status: 'active'
        });

        await conversation.save();

        // Re-populate for consistency
        conversation = await Conversation.findById(conversation._id).populate('booking');
    }

    return conversation;
};

// GET /api/chat/conversations - Get list of conversations for current user
router.get('/conversations', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Strategy to ensure Partners see their conversations:
        // 1. Find all services owned by this user
        // 2. Find all bookings for these services
        // 3. Find conversations for these bookings OR where user is explicitly a participant

        // 1. Find Owned Services
        const ownedTours = await Tour.find({ owner: userId }).select('_id');
        const ownedServices = await PartnerService.find({ owner: userId }).select('_id');
        const ownedStories = await Story.find({ author: userId }).select('_id'); // Should be 'author' based on models

        const tourIds = ownedTours.map(t => t._id);
        const serviceIds = ownedServices.map(s => s._id);
        const storyIds = ownedStories.map(s => s._id);

        // 2. Find Related Bookings
        const relatedBookings = await Booking.find({
            $or: [
                { tour: { $in: tourIds } },
                { partnerService: { $in: serviceIds } },
                { story: { $in: storyIds } },
                { user: userId } // Also include bookings where I am the customer (unlikely for partner view but good for hybrid)
            ]
        }).select('_id');

        const bookingIds = relatedBookings.map(b => b._id);

        // 3. Find Conversations
        // Search by Participants (normal way) OR by Booking ID (if I own the booked service)

        const query = {
            $or: [
                { participants: userId },
                { booking: { $in: bookingIds } }
            ]
            // Removed status: 'active' temporarily to rule it out
        };

        const conversations = await Conversation.find(query)
            .sort({ updatedAt: -1 }) // Most recent first
            .populate('booking', 'serviceInfo status totalPrice')
            .populate('participants', 'name avatar role')
            .lean();

        // Format for frontend
        const formattedConversations = conversations.map(conv => {
            try {
                // Find the "other" participant safely
                // If I am the partner, I want to see the USER (customer)
                // If I am the user, I want to see the PARTNER (provider)

                let otherParticipant = null;
                if (conv.participants && Array.isArray(conv.participants)) {
                    otherParticipant = conv.participants.find(p => p && p._id && p._id.toString() !== userId);
                }

                // Fallback: If "other" not found in participants (maybe I'm not in participants list yet), try to deduce
                if (!otherParticipant) {
                    // This creates a visual placeholder if the participant logic is out of sync
                    // Ideally, we should fix the participants list in the DB, but for display:
                    if (conv.booking && conv.booking.user && conv.booking.user.toString() !== userId) {
                        // Likely the customer
                        // We can't easily populate 'booking.user' here efficiently without changing the main query populate.
                        // But 'booking' is populated with 'serviceInfo'.
                        // Let's assume the frontend handles 'Unknown' gracefully or we rely on what we have.
                    }
                }

                // Ensure basic required fields exist
                if (!conv._id) return null;

                return {
                    _id: conv._id,
                    bookingId: conv.booking?._id || conv.booking,
                    bookingInfo: conv.booking || {}, // Fallback to empty object
                    partner: {
                        _id: otherParticipant?._id,
                        name: otherParticipant?.name || 'Unknown User',
                        avatar: otherParticipant?.avatar || '',
                        role: otherParticipant?.role
                    },
                    lastMessage: conv.lastMessage,
                    updatedAt: conv.updatedAt
                };
            } catch (err) {
                console.error(`Error mapping conversation ${conv._id}:`, err);
                return null;
            }
        }).filter(Boolean); // Remove nulls

        res.json({
            success: true,
            data: formattedConversations
        });

    } catch (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/chat/:bookingId - Get chat history
router.get('/:bookingId', requireAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.userId;

        // Find or create conversation
        const conversation = await getConversation(bookingId, userId);

        // Security Check: Is user a participant?
        const isParticipant = conversation.participants.some(p => p.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch messages
        const messages = await Message.find({ conversation: conversation._id })
            .sort({ createdAt: 1 })
            .populate('sender', 'name avatar');

        res.json({
            success: true,
            data: {
                conversation,
                messages
            }
        });

    } catch (err) {
        console.error('Error fetching chat:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/chat/:bookingId/messages - Send message
router.post('/:bookingId/messages', requireAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { text } = req.body;
        const userId = req.user.userId;

        if (!text) return res.status(400).json({ error: 'Message text is required' });

        const conversation = await getConversation(bookingId, userId);

        // Security Check
        const isParticipant = conversation.participants.some(p => p.toString() === userId);
        if (!isParticipant) return res.status(403).json({ error: 'Access denied' });

        // Create Message
        const message = new Message({
            conversation: conversation._id,
            sender: userId,
            text,
            readBy: [userId]
        });

        await message.save();

        // Update Conversation Last Message
        conversation.lastMessage = {
            text,
            sender: userId,
            timestamp: new Date()
        };
        await conversation.save();

        // Populate sender for immediate return
        await message.populate('sender', 'name avatar');

        res.status(201).json({ success: true, data: message });

    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/chat/:bookingId - Soft delete (archive) conversation
router.delete('/:bookingId', requireAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.userId;

        const conversation = await getConversation(bookingId, userId);

        // Security Check
        const isParticipant = conversation.participants.some(p => p.toString() === userId);
        if (!isParticipant) return res.status(403).json({ error: 'Access denied' });

        conversation.status = 'archived';
        await conversation.save();

        res.json({ success: true, message: 'Conversation archived' });

    } catch (err) {
        console.error('Error archiving conversation:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;