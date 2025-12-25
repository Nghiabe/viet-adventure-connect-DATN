import express from 'express';
import mongoose from 'mongoose';
import Story from '../models/Story.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/community/hub - Aggregate data for the hub page
router.get('/hub', async (req, res) => {
    try {
        // 1. Featured Story (Find one featured, or defined by logic)
        // For now, get the one with most likes created recently, or explicitly flagged 'featured'
        let featuredStory = await Story.findOne({ status: 'published', featured: true })
            .populate('author', 'name avatar')
            .lean();

        if (!featuredStory) {
            // Fallback to most liked recently
            featuredStory = await Story.findOne({ status: 'published' })
                .sort({ likeCount: -1, createdAt: -1 })
                .populate('author', 'name avatar')
                .lean();
        }

        // 2. Latest Stories
        const latestStories = await Story.find({
            status: 'published',
            _id: { $ne: featuredStory?._id }
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('author', 'name avatar')
            .lean();

        // 3. Trending Tags (Aggregation)
        // Simple aggregation to count tags
        const trendingTagsRaw = await Story.aggregate([
            { $match: { status: 'published' } },
            { $unwind: '$tags' },
            { $group: { _id: { $toLower: '$tags' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const trendingTags = trendingTagsRaw.map(t => ({ tag: t._id, count: t.count }));

        // 4. Top Authors (Mock or Aggregate)
        // Aggregation to find users with most published stories
        const topAuthorsRaw = await Story.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: '$author', storyCount: { $sum: 1 } } },
            { $sort: { storyCount: -1 } },
            { $limit: 3 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' }
        ]);

        const topAuthors = topAuthorsRaw.map(a => ({
            _id: a._id,
            name: a.user.name,
            avatar: a.user.avatar,
            storyCount: a.storyCount,
            followerCount: Math.floor(Math.random() * 1000) // Mock for now
        }));

        // 5. Community Stats
        const totalStories = await Story.countDocuments({ status: 'published' });
        const totalMembers = await User.countDocuments({});
        // Stories this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const storiesThisWeek = await Story.countDocuments({
            status: 'published',
            createdAt: { $gte: oneWeekAgo }
        });

        res.json({
            featuredStory,
            latestStories,
            trendingTags,
            topAuthors,
            communityStats: {
                totalStories,
                totalMembers,
                storiesThisWeek
            }
        });

    } catch (err) {
        console.error('Error in /api/community/hub:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/stories/:id - Get single story details
router.get('/stories/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const story = await Story.findById(req.params.id)
            .populate('author', 'name avatar')
            .lean();

        if (!story) {
            return res.status(404).json({ success: false, error: 'Story not found' });
        }

        // Handle missing author (if user was deleted)
        if (!story.author) {
            story.author = {
                _id: 'unknown',
                name: 'Unknown User',
                avatar: '' // Default avatar or empty
            };
        }

        // Increment views
        await Story.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

        res.json({ success: true, data: story });
    } catch (err) {
        console.error('Error fetching story:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/stories - Create new story
router.post('/stories', requireAuth, async (req, res) => {
    try {
        const { title, content, tags, coverImage } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, error: 'Title and content are required' });
        }

        const newStory = new Story({
            title,
            content,
            tags: Array.isArray(tags) ? tags : [],
            coverImage,
            author: req.user.userId, // from requireAuth middleware
            status: 'published' // Or 'pending' if you want moderation
        });

        await newStory.save();

        // Populate author for immediate return if needed
        await newStory.populate('author', 'name avatar');

        res.status(201).json({ success: true, story: newStory });

    } catch (err) {
        console.error('Error creating story:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/stories/:id/like - Like a story
router.post('/stories/:id/like', requireAuth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ error: 'Story not found' });

        const userId = req.user.userId;
        const alreadyLiked = story.likes.includes(userId);

        if (alreadyLiked) {
            story.likes.pull(userId);
        } else {
            story.likes.push(userId);
        }

        story.likeCount = story.likes.length;
        await story.save();

        res.json({ success: true, likeCount: story.likeCount, isLiked: !alreadyLiked });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
