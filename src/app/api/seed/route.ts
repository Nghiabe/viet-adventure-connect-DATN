// src/app/api/seed/route.ts

// This file mirrors a Next.js route handler signature, but our project is Vite-based.
// We keep it so path aliases and logic stay consistent. It will not be used by Vite directly.
import { seedHaLong } from '@/lib/seedHaLong';
type Json = Record<string, unknown>;

// --- DATA DEFINITIONS ---
const haLongBayData = {
  name: 'Vịnh Hạ Long',
  slug: 'ha-long-bay',
  description:
    'Vịnh Hạ Long - một trong bảy kỳ quan thiên nhiên mới của thế giới, là điểm đến không thể bỏ qua với hàng ngàn đảo đá vôi hùng vĩ và làn nước trong xanh màu ngọc bích.',
  history:
    'Vịnh Hạ Long đã được UNESCO nhiều lần công nhận là Di sản Thiên nhiên Thế giới.',
  culture:
    'Văn hóa của Hạ Long là sự giao thoa của cuộc sống làng chài truyền thống và du lịch hiện đại.',
  geography:
    'Nằm ở bờ Tây Vịnh Bắc Bộ, Vịnh Hạ Long có tổng diện tích 1553 km² với 1969 hòn đảo lớn nhỏ.',
  mainImage:
    'https://images.unsplash.com/photo-1590237739814-a089f6483656?q=80&w=2940&auto=format&fit=crop',
  imageGallery: [
    'https://images.unsplash.com/photo-1563231189-9a7defb2659b?q=80&w=2938&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526316284533-535451a94a2a?q=80&w=2942&auto=format&fit=crop',
  ],
  bestTimeToVisit:
    'Thời điểm lý tưởng nhất để thăm Vịnh Hạ Long là từ tháng 3 đến tháng 5 và từ tháng 9 đến tháng 11.',
  essentialTips: ['Nhớ mang theo kem chống nắng.', 'Đặt tour du thuyền trước.', 'Thử món chả mực Hạ Long.'],
};

const toursForHaLong = [
  {
    title: 'Du thuyền 2 ngày 1 đêm khám phá Vịnh Hạ Long',
    price: 2500000,
    duration: '2 ngày 1 đêm',
    maxGroupSize: 20,
    description:
      'Trải nghiệm một đêm huyền ảo trên du thuyền sang trọng, tham gia chèo kayak, thăm hang Sửng Sốt và tắm biển tại đảo Ti Tốp.',
    itinerary: [
      { day: 1, title: 'Ngày 1: Khám phá', description: 'Xe đón, lên du thuyền, ăn trưa, thăm hang Sửng Sốt.' },
      { day: 2, title: 'Ngày 2: Trở về', description: 'Ngắm bình minh, thăm đảo Ti Tốp, trả phòng.' },
    ],
    inclusions: ['Xe đưa đón', 'Các bữa ăn trên tàu', 'Vé tham quan'],
    exclusions: ['Đồ uống', 'Chi phí cá nhân'],
    isSustainable: true,
  },
  {
    title: 'Tour trong ngày tham quan Vịnh Hạ Long',
    price: 850000,
    duration: '1 ngày',
    maxGroupSize: 40,
    description:
      'ành cho du khách có ít thời gian, tour trong ngày sẽ đưa bạn đến những điểm nổi bật nhất của vịnh.',
    itinerary: [
      { day: 1, title: 'Hành trình 6 tiếng', description: 'Lên tàu, đi qua hòn Chó Đá, hòn Gà Chọi, thăm hang Sửng Sốt.' },
    ],
    inclusions: ['Bữa trưa trên tàu', 'Vé tham quan'],
    exclusions: ['Đồ uống'],
  },
];

// --- API HANDLER ---
export async function POST(): Promise<{ status: number; body: Json }> {
  if (process.env.NODE_ENV !== 'development') {
    return { status: 403, body: { success: false, message: 'This API is only available in development mode.' } };
  }
  try {
    const data = await seedHaLong();
    return { status: 200, body: { success: true, message: 'Database seeded successfully!', data } };
  } catch (error: any) {
    return { status: 500, body: { success: false, message: `Seeding failed: ${error.message}` } };
  }
}