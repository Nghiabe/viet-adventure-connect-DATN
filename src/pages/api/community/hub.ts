import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import cache, { CACHE_KEYS } from '@/lib/cache';
import Story from '@/models/Story';
import User from '@/models/User';

// Types for our API response
interface CommunityHubData {
  featuredStory: {
    _id: string;
    title: string;
    content: string;
    coverImage?: string;
    tags: string[];
    likeCount: number;
    createdAt: string;
    author: {
      _id: string;
      name: string;
      avatar?: string;
    };
  } | null;
  latestStories: Array<{
    _id: string;
    title: string;
    content: string;
    coverImage?: string;
    tags: string[];
    likeCount: number;
    createdAt: string;
    author: {
      _id: string;
      name: string;
      avatar?: string;
    };
  }>;
  trendingTags: Array<{
    tag: string;
    count: number;
  }>;
  topAuthors: Array<{
    _id: string;
    name: string;
    avatar?: string;
    followerCount: number;
    storyCount: number;
  }>;
  communityStats: {
    totalStories: number;
    totalMembers: number;
    storiesThisWeek: number;
  };
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Check cache first
    const cachedData = await cache.get<CommunityHubData>(CACHE_KEYS.COMMUNITY_HUB_DATA);
    
    if (cachedData) {
      console.log('Cache hit for community hub data');
      return send(res, 200, {
        success: true,
        data: cachedData,
        cached: true
      });
    }

    console.log('Cache miss for community hub data, fetching from database...');
    
    // Connect to database
    await dbConnect();

    // Execute all queries in parallel for maximum performance
    const [
      featuredStory,
      latestStories,
      trendingTags,
      topAuthors,
      totalStories,
      totalMembers,
      storiesThisWeek
    ] = await Promise.all([
      // Featured Story: Get the story with highest likeCount that is approved
      Story.findOne({ status: 'approved' })
        .sort({ likeCount: -1 })
        .populate('author', 'name avatar')
        .lean(),

      // Latest Stories: Get 5 most recent stories (all statuses)
      Story.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('author', 'name avatar')
        .lean(),

      // Trending Tags: MongoDB aggregation pipeline
      Story.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { tag: '$_id', count: 1, _id: 0 } }
      ]),

      // Top Authors: Complex aggregation to get authors with most stories and likes
      Story.aggregate([
        { $group: {
          _id: '$author',
          storyCount: { $sum: 1 },
          totalLikes: { $sum: '$likeCount' }
        }},
        { $sort: { totalLikes: -1, storyCount: -1 } },
        { $limit: 3 },
        { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'authorInfo'
        }},
        { $unwind: '$authorInfo' },
        { $project: {
          _id: '$authorInfo._id',
          name: '$authorInfo.name',
          avatar: '$authorInfo.avatar',
          followerCount: { $ifNull: ['$authorInfo.contributionScore', 0] }, // Using contributionScore as proxy for followers
          storyCount: 1
        }}
      ]),

      // Community Stats: Total stories (true total count)
      Story.estimatedDocumentCount(),

      // Community Stats: Total members (true total count)
      User.estimatedDocumentCount(),

      // Community Stats: Stories this week
      Story.countDocuments({
        status: 'approved',
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      })
    ]);

    // Transform the data to match our API contract
    const communityHubData: CommunityHubData = {
      featuredStory: featuredStory ? {
        _id: featuredStory._id.toString(),
        title: featuredStory.title,
        content: featuredStory.content,
        coverImage: featuredStory.coverImage,
        tags: featuredStory.tags,
        likeCount: featuredStory.likeCount,
        createdAt: featuredStory.createdAt.toISOString(),
        author: {
          _id: featuredStory.author._id.toString(),
          name: (featuredStory.author as any).name,
          avatar: (featuredStory.author as any).avatar
        }
      } : null,
      
      latestStories: latestStories.map(story => ({
        _id: story._id.toString(),
        title: story.title,
        content: story.content,
        coverImage: story.coverImage,
        tags: story.tags,
        likeCount: story.likeCount,
        createdAt: story.createdAt.toISOString(),
        author: {
          _id: story.author._id.toString(),
          name: (story.author as any).name,
          avatar: (story.author as any).avatar
        }
      })),

      trendingTags: trendingTags.map(tag => ({
        tag: tag.tag,
        count: tag.count
      })),

      topAuthors: topAuthors.map(author => ({
        _id: author._id.toString(),
        name: author.name,
        avatar: author.avatar,
        followerCount: author.followerCount,
        storyCount: author.storyCount
      })),

      communityStats: {
        totalStories,
        totalMembers,
        storiesThisWeek
      }
    };

    // Cache the result for 10 minutes (600 seconds)
    await cache.set(CACHE_KEYS.COMMUNITY_HUB_DATA, communityHubData, 600);

    console.log('Community hub data fetched and cached successfully');

    return send(res, 200, {
      success: true,
      data: communityHubData,
      cached: false
    });

  } catch (error: any) {
    console.error('Community hub API error:', error);
    
    return send(res, 500, {
      success: false,
      error: 'Lỗi server, vui lòng thử lại sau'
    });
  }
}
