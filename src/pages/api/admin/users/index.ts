import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';
import User from '@/models/User';
import Booking from '@/models/Booking';
import Tour from '@/models/Tour';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default withRole(['admin', 'staff'], async function handler(req: AuthedRequest & { url?: string }, res: ServerResponse) {
  if (req.method !== 'GET') return send(res, 405, { success: false, error: 'Method Not Allowed' });
  await dbConnect();

  const url = new URL(req.url || '', 'http://localhost');
  const role = url.searchParams.get('role'); // 'user' | 'partner' | 'staff'
  const status = url.searchParams.get('status'); // 'active' | 'pending_approval' | 'suspended'
  const search = (url.searchParams.get('search') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  const query: any = {};
  if (role === 'user') query.role = 'user';
  else if (role === 'partner') query.role = 'partner';
  else if (role === 'staff') query.role = { $in: ['staff', 'admin'] };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [total, rows] = await Promise.all([
    User.countDocuments(query),
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  // Decorate per-role aggregates
  let data = rows.map((u) => ({ ...u, _id: String(u._id) }));

  if (role === 'user') {
    const ids = data.map((u) => u._id);
    const agg = await Booking.aggregate([
      { $match: { user: { $in: ids.map((id) => (global as any).mongoose.Types.ObjectId.createFromHexString(id)) }, status: { $in: ['confirmed', 'refunded', 'cancelled', 'pending'] } } },
      { $group: { _id: '$user', totalBookings: { $sum: 1 }, totalSpend: { $sum: '$totalPrice' } } },
    ]);
    const map = new Map<string, any>();
    agg.forEach((a: any) => map.set(String(a._id), a));
    data = data.map((u) => ({
      ...u,
      totalBookings: map.get(u._id)?.totalBookings || 0,
      totalSpend: map.get(u._id)?.totalSpend || 0,
    }));
  } else if (role === 'partner') {
    const ids = data.map((u) => u._id);
    const tours = await Tour.aggregate([
      { $match: { owner: { $in: ids.map((id) => (global as any).mongoose.Types.ObjectId.createFromHexString(id)) } } },
      { $group: { _id: '$owner', tourCount: { $sum: 1 }, avgRating: { $avg: '$averageRating' } } },
    ]);
    const map = new Map<string, any>();
    tours.forEach((t: any) => map.set(String(t._id), t));
    data = data.map((u) => ({
      ...u,
      tourCount: map.get(u._id)?.tourCount || 0,
      avgRating: Number(map.get(u._id)?.avgRating || 0),
    }));
  } else if (role === 'staff') {
    data = data.map((u) => ({ ...u, lastLogin: null }));
  }

  return send(res, 200, { success: true, data: { total, page, limit, rows: data } });
});






















































