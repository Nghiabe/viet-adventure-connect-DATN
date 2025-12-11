// scripts/seed-user-badges.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dbConnect from '../src/lib/dbConnect';
import User from '../src/models/User';
import Badge from '../src/models/Badge';
import UserBadge from '../src/models/UserBadge';

dotenv.config({ path: '.env.local' });

// --- CONFIGURATION ---
const TARGET_USER_EMAIL = 'nghiantk.21it@vku.udn.vn';
const BADGES_TO_AWARD = [
  'Chuyến đi đầu tiên',
  'Nhiếp ảnh gia',
  'Tín đồ ẩm thực',
];
// --- END CONFIGURATION ---

async function seedUserBadges() {
  console.log(`--- Starting badge award process for user: ${TARGET_USER_EMAIL} ---`);
  try {
    await dbConnect();
    console.log('Database connection successful.');

    // 1) Locate user
    const targetUser = await User.findOne({ email: TARGET_USER_EMAIL });
    if (!targetUser) {
      throw new Error(`Could not find user with email: ${TARGET_USER_EMAIL}`);
    }
    console.log(`Found user: ${targetUser.name} (_id: ${targetUser._id})`);

    // 2) Fetch badges by name
    const badges = await Badge.find({ name: { $in: BADGES_TO_AWARD } });
    if (badges.length !== BADGES_TO_AWARD.length) {
      const foundNames = new Set(badges.map((b) => b.name));
      const missing = BADGES_TO_AWARD.filter((n) => !foundNames.has(n));
      console.warn('Warning: Not all specified badges were found in the database:', missing);
      console.warn('Please run the badge seeder first: npm run seed:badges');
    }
    if (badges.length === 0) {
      throw new Error('No badges found to award. Seed the `badges` collection first.');
    }
    console.log(`Found ${badges.length} badge documents to award: ${badges.map((b) => b.name).join(', ')}`);

    // 3) Purge existing user badges (idempotent)
    console.log('🧹 Clearing existing badges for user...');
    const del = await UserBadge.deleteMany({ user: targetUser._id });
    console.log(`✅ ${del.deletedCount} old badges cleared.`);

    // 4) Insert new relations
    const docs = badges.map((badge) => ({ user: targetUser._id, badge: badge._id, earnedAt: new Date() }));
    console.log(`🌱 Awarding ${docs.length} new badges...`);
    await UserBadge.insertMany(docs);

    // 5) Verify
    const count = await UserBadge.countDocuments({ user: targetUser._id });
    console.log(`✅ VERIFIED: User now has ${count} badges.`);
  } catch (err) {
    console.error('❌ An error occurred during the user badge seeding process:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seedUserBadges();




