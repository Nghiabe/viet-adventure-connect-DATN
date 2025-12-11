// scripts/seed-badges.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dbConnect from '../src/lib/dbConnect';
import Badge from '../src/models/Badge';

dotenv.config({ path: '.env.local' });

const badgesToSeed = [
  // Du lịch
  {
    name: 'Chuyến đi đầu tiên',
    description: 'Hoàn thành đơn hàng đầu tiên của bạn và bắt đầu hành trình khám phá.',
    iconUrl: 'airplane',
    category: 'Du lịch' as const,
  },
  {
    name: 'Tín đồ ẩm thực',
    description: 'Đặt và hoàn thành một tour có chủ đề ẩm thực.',
    iconUrl: 'food',
    category: 'Du lịch' as const,
  },
  {
    name: 'Chinh phục núi non',
    description: 'Đặt và hoàn thành một tour trekking hoặc leo núi.',
    iconUrl: 'mountain',
    category: 'Du lịch' as const,
  },
  {
    name: 'Bậc thầy địa điểm',
    description: 'Ghé thăm và check-in tại 5 điểm đến khác nhau.',
    iconUrl: 'map-pin',
    category: 'Du lịch' as const,
  },
  {
    name: 'Du khách thường xuyên',
    description: 'Hoàn thành 5 đơn hàng trên Vietravel.',
    iconUrl: 'calendar-check',
    category: 'Du lịch' as const,
  },
  // Xã hội
  {
    name: 'Nhiếp ảnh gia',
    description: 'Đăng tải bài viết chia sẻ đầu tiên có hình ảnh.',
    iconUrl: 'camera',
    category: 'Xã hội' as const,
  },
  {
    name: 'Nhà phê bình 5 sao',
    description: 'Viết một đánh giá được cộng đồng yêu thích (trên 10 lượt thích).',
    iconUrl: 'star',
    category: 'Xã hội' as const,
  },
  {
    name: 'Kết nối xã hội',
    description: 'Mời thành công một người bạn tham gia Vietravel.',
    iconUrl: 'users',
    category: 'Xã hội' as const,
  },
  // Thành tựu
  {
    name: 'Nhà thám hiểm',
    description: 'Sưu tầm được 5 huy hiệu khác nhau.',
    iconUrl: 'compass',
    category: 'Thành tựu' as const,
  },
  {
    name: 'Nhà vô địch',
    description: 'Trở thành Tác giả Nổi bật trong tuần.',
    iconUrl: 'trophy',
    category: 'Thành tựu' as const,
  },
  {
    name: 'Thợ săn thành tựu',
    description: 'Sưu tầm được 10 huy hiệu khác nhau.',
    iconUrl: 'gem',
    category: 'Thành tựu' as const,
  },
  {
    name: 'Đại sứ Vietravel',
    description: 'Hoàn thành tất cả các huy hiệu khác.',
    iconUrl: 'shield-check',
    category: 'Thành tựu' as const,
  },
];

async function seedBadges() {
  console.log('--- Starting Badge seeding process ---');
  try {
    await dbConnect();
    console.log('Database connection successful.');

    console.log('🧹 Clearing old badges...');
    await Badge.deleteMany({});
    console.log('✅ Old badges cleared.');

    console.log(`🌱 Inserting ${badgesToSeed.length} new badges...`);
    await Badge.insertMany(badgesToSeed);

    const count = await Badge.countDocuments();
    console.log(`✅ VERIFIED: ${count} badges now exist in the collection.`);
  } catch (error) {
    console.error('❌ An error occurred during the badge seeding process:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seedBadges();




