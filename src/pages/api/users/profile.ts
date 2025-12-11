import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import { withAuth, AuthedRequest } from '@/lib/auth/withAuth';
import User from '@/models/User';
import Booking from '@/models/Booking';
import Badge from '@/models/Badge';
import UserBadge from '@/models/UserBadge';
import Story from '@/models/Story';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default withAuth(async function handler(req: AuthedRequest, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    await dbConnect();
    const userId = req.user?.userId;
    if (!userId) return send(res, 401, { success: false, error: 'Unauthorized' });

    const [user, allBadges, userBadges, journeys, stories] = await Promise.all([
      User.findById(userId).lean(),
      Badge.find({}).lean(),
      UserBadge.find({ user: userId }).populate('badge').lean(),
      Booking.find({ user: userId })
        .sort({ bookingDate: -1 })
        .populate({ path: 'tour', select: 'title mainImage slug' })
        .lean(),
      Story.find({ author: userId }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!user) return send(res, 404, { success: false, error: 'User not found.' });

    // Single Source of Truth for earned badges
    const earnedBadges = (userBadges || []).map((ub: any) => ub.badge).filter(Boolean);
    const earnedBadgeIds = new Set((earnedBadges || []).map((b: any) => String(b._id)));
    const earnedBadgesCount = earnedBadgeIds.size;
    const totalBadgesCount = (allBadges || []).length;
    const completionPercentage = totalBadgesCount > 0 ? Math.round((earnedBadgesCount / totalBadgesCount) * 100) : 0;

    let level = 'Tân binh';
    if (earnedBadgesCount >= 1) level = 'Nhà thám hiểm';
    if (earnedBadgesCount >= 5) level = 'Lữ khách dày dạn';

    const allBadgesWithStatus = (allBadges || []).map((badge: any) => {
      const isEarned = earnedBadgeIds.has(String(badge._id));
      const userBadgeRecord = isEarned ? (userBadges || []).find((ub: any) => String(ub.badge?._id || ub.badge) === String(badge._id)) : null;
      return {
        ...badge,
        isEarned,
        earnedAt: userBadgeRecord ? userBadgeRecord.earnedAt : null,
      };
    });

    const payload = {
      profile: {
        name: user.name,
        avatarInitials: (user.name || '').split(' ').map((n: string) => n[0]).filter(Boolean).join('').toUpperCase(),
        memberSince: user.createdAt,
        level,
      },
      gamification: {
        earnedBadgesCount,
        totalBadgesCount,
        completionPercentage,
        allBadges: allBadgesWithStatus,
      },
      journeys: (journeys || []).map((j: any) => ({
        _id: String(j._id),
        tourTitle: j.tour?.title || 'Tour không còn tồn tại',
        bookingDate: j.bookingDate,
        status: j.status,
      })),
      stories: (stories || []).map((s: any) => ({
        _id: String(s._id),
        title: s.title,
        createdAt: s.createdAt,
        coverImage: s.coverImage,
      })),
    };

    return send(res, 200, { success: true, data: payload });
  } catch (error: any) {
    return send(res, 500, { success: false, error: error?.message || 'Internal Server Error' });
  }
});


