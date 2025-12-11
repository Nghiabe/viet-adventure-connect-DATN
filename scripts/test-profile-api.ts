import 'dotenv/config';
import fetch from 'node-fetch';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signJwt } from '@/lib/auth/jwt';

async function main() {
  await dbConnect();

  const email = process.env.TEST_USER_EMAIL || 'user@gmail.com';
  const user = await User.findOne({ email }).lean();
  if (!user) throw new Error(`Test user not found: ${email}`);

  const token = signJwt({ userId: String(user._id), role: user.role as any });

  const url = 'http://localhost:5173/api/users/profile';
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': `auth_token=${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${res.statusText} - ${text}`);
  }

  const body = await res.json();
  if (!body?.success) throw new Error('Response success=false');
  const data = body.data;
  if (!data) throw new Error('Missing data');
  if (!data.profile) throw new Error('Missing data.profile');
  if (!data.gamification) throw new Error('Missing data.gamification');
  if (!Array.isArray(data.gamification.allBadges)) throw new Error('gamification.allBadges is not array');
  if (typeof data.gamification.earnedBadgesCount !== 'number') throw new Error('earnedBadgesCount not number');
  if (!Array.isArray(data.journeys)) throw new Error('journeys is not array');
  if (!Array.isArray(data.stories)) throw new Error('stories is not array');

  const hasEarned = data.gamification.allBadges.some((b: any) => b.isEarned === true);
  const hasUnEarned = data.gamification.allBadges.some((b: any) => b.isEarned === false);
  if (!hasEarned || !hasUnEarned) throw new Error('Badges do not contain both earned and unearned');

  console.log('✅ All API tests passed!');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});




