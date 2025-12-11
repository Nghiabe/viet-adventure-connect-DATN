/* eslint-disable no-console */
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';

import dbConnect from '../src/lib/dbConnect.js';
import User from '../src/models/User.js';
import Destination from '../src/models/Destination.js';
import Tour from '../src/models/Tour.js';
import Booking from '../src/models/Booking.js';
import Review from '../src/models/Review.js';
import Story from '../src/models/Story.js';
import Itinerary from '../src/models/Itinerary.js';
import Badge from '../src/models/Badge.js';
import UserBadge from '../src/models/UserBadge.js';
import Notification from '../src/models/Notification.js';

// Set faker locale to Vietnamese for more realistic data
// Note: faker.setLocale is deprecated in newer versions

async function createUsers() {
  console.log('👥 Creating users...');
  
  const usersData = [
    {
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin' as const,
      status: 'active' as const,
    },
    {
      name: 'Nguyễn Văn A',
      email: 'partner1@gmail.com',
      password: 'partner123',
      role: 'partner' as const,
      status: 'active' as const,
    },
    {
      name: 'Trần Thị B',
      email: 'partner2@gmail.com',
      password: 'partner123',
      role: 'partner' as const,
      status: 'active' as const,
    },
    {
      name: 'Lê Văn C',
      email: 'staff1@gmail.com',
      password: 'staff123',
      role: 'staff' as const,
      status: 'active' as const,
    },
    {
      name: 'Phạm Thị D',
      email: 'customer1@gmail.com',
      password: 'customer123',
      role: 'user' as const,
      status: 'active' as const,
    },
    {
      name: 'Hoàng Văn E',
      email: 'customer2@gmail.com',
      password: 'customer123',
      role: 'user' as const,
      status: 'active' as const,
    },
    {
      name: 'Vũ Thị F',
      email: 'customer3@gmail.com',
      password: 'customer123',
      role: 'user' as const,
      status: 'active' as const,
    },
    {
      name: 'Đặng Văn G',
      email: 'customer4@gmail.com',
      password: 'customer123',
      role: 'user' as const,
      status: 'active' as const,
    },
    {
      name: 'Bùi Thị H',
      email: 'customer5@gmail.com',
      password: 'customer123',
      role: 'user' as const,
      status: 'active' as const,
    },
  ];

  const createdUsers = await User.insertMany(usersData);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

async function createDestinations() {
  console.log('🗺️ Creating destinations...');
  
  const destinationsData = [
    {
      name: 'Vịnh Hạ Long',
      slug: 'ha-long-bay',
      description: 'Vịnh Hạ Long - một trong bảy kỳ quan thiên nhiên mới của thế giới, là điểm đến không thể bỏ qua với hàng ngàn đảo đá vôi hùng vĩ và làn nước trong xanh màu ngọc bích.',
      history: 'Vịnh Hạ Long đã được UNESCO nhiều lần công nhận là Di sản Thiên nhiên Thế giới.',
      culture: 'Văn hóa của Hạ Long là sự giao thoa của cuộc sống làng chài truyền thống và du lịch hiện đại.',
      geography: 'Nằm ở bờ Tây Vịnh Bắc Bộ, Vịnh Hạ Long có tổng diện tích 1553 km² với 1969 hòn đảo lớn nhỏ.',
      mainImage: 'https://images.unsplash.com/photo-1590237739814-a089f6483656?q=80&w=2940&auto=format&fit=crop',
      imageGallery: [
        'https://images.unsplash.com/photo-1563231189-9a7defb2659b?q=80&w=2938&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1526316284533-535451a94a2a?q=80&w=2942&auto=format&fit=crop',
      ],
      bestTimeToVisit: 'Thời điểm lý tưởng nhất để thăm Vịnh Hạ Long là từ tháng 3 đến tháng 5 và từ tháng 9 đến tháng 11.',
      essentialTips: ['Nhớ mang theo kem chống nắng.', 'Đặt tour du thuyền trước.', 'Thử món chả mực Hạ Long.'],
      status: 'published' as const,
    },
    {
      name: 'Phố cổ Hội An',
      slug: 'hoi-an-old-town',
      description: 'Phố cổ Hội An - di sản văn hóa thế giới UNESCO, nổi tiếng với kiến trúc cổ kính, đèn lồng rực rỡ và ẩm thực đặc sắc.',
      history: 'Hội An từng là một thương cảng sầm uất từ thế kỷ 15-19, nơi giao thương giữa các nước châu Á và châu Âu.',
      culture: 'Văn hóa Hội An là sự kết hợp độc đáo giữa văn hóa Việt Nam, Trung Hoa và Nhật Bản.',
      geography: 'Nằm ở tỉnh Quảng Nam, cách Đà Nẵng khoảng 30km về phía Nam.',
      mainImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
      imageGallery: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
      ],
      bestTimeToVisit: 'Tháng 2-4 và 8-10 là thời điểm lý tưởng để thăm Hội An.',
      essentialTips: ['Tham quan vào buổi tối để ngắm đèn lồng.', 'Thử món cao lầu.', 'Mặc áo dài truyền thống.'],
      status: 'published' as const,
    },
    {
      name: 'Sapa',
      slug: 'sapa',
      description: 'Sapa - thị trấn mờ sương trên núi cao, nổi tiếng với ruộng bậc thang, văn hóa dân tộc thiểu số và khí hậu mát mẻ.',
      history: 'Sapa được người Pháp phát hiện vào đầu thế kỷ 20 và xây dựng thành nơi nghỉ dưỡng mùa hè.',
      culture: 'Văn hóa Sapa đa dạng với nhiều dân tộc thiểu số như H\'Mông, Dao, Tày, Giáy.',
      geography: 'Nằm ở độ cao 1.600m so với mực nước biển, thuộc tỉnh Lào Cai.',
      mainImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
      imageGallery: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
      ],
      bestTimeToVisit: 'Tháng 9-11 và 3-5 là thời điểm đẹp nhất để thăm Sapa.',
      essentialTips: ['Mang theo áo ấm.', 'Thử món thắng cố.', 'Đi bộ khám phá ruộng bậc thang.'],
      status: 'published' as const,
    },
    {
      name: 'Phú Quốc',
      slug: 'phu-quoc',
      description: 'Phú Quốc - hòn đảo ngọc của Việt Nam, nổi tiếng với những bãi biển đẹp, nước biển trong xanh và hải sản tươi ngon.',
      history: 'Phú Quốc từng là nơi sản xuất nước mắm nổi tiếng và là điểm giao thương quan trọng.',
      culture: 'Văn hóa Phú Quốc gắn liền với nghề biển và du lịch biển.',
      geography: 'Là hòn đảo lớn nhất Việt Nam, nằm ở vịnh Thái Lan.',
      mainImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
      imageGallery: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
      ],
      bestTimeToVisit: 'Tháng 11-4 là mùa khô, thời điểm lý tưởng để thăm Phú Quốc.',
      essentialTips: ['Thử món nước mắm Phú Quốc.', 'Đi thuyền khám phá đảo.', 'Ngắm hoàng hôn tại Sunset Sanato.'],
      status: 'published' as const,
    },
    {
      name: 'Đà Nẵng',
      slug: 'da-nang',
      description: 'Đà Nẵng - thành phố đáng sống nhất Việt Nam, nổi tiếng với bãi biển Mỹ Khê, núi Ngũ Hành Sơn và cầu Rồng.',
      history: 'Đà Nẵng có lịch sử lâu đời, từng là cảng biển quan trọng của vương quốc Champa.',
      culture: 'Văn hóa Đà Nẵng là sự kết hợp giữa văn hóa Champa cổ đại và văn hóa Việt Nam hiện đại.',
      geography: 'Nằm ở miền Trung Việt Nam, giáp biển Đông.',
      mainImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
      imageGallery: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2946&auto=format&fit=crop',
      ],
      bestTimeToVisit: 'Tháng 2-5 là thời điểm lý tưởng để thăm Đà Nẵng.',
      essentialTips: ['Thử món mì Quảng.', 'Leo núi Ngũ Hành Sơn.', 'Ngắm cầu Rồng phun lửa vào cuối tuần.'],
      status: 'published' as const,
    },
  ];

  const createdDestinations = await Destination.insertMany(destinationsData);
  console.log(`✅ Created ${createdDestinations.length} destinations`);
  return createdDestinations;
}

async function createTours(users: any[], destinations: any[]) {
  console.log('🚢 Creating tours...');
  
  const partnerUsers = users.filter(user => user.role === 'partner');
  const toursData = [];
  
  for (const destination of destinations) {
    const owner = faker.helpers.arrayElement(partnerUsers);
    
    // Create 2-3 tours per destination
    const tourCount = faker.number.int({ min: 2, max: 3 });
    
    for (let i = 0; i < tourCount; i++) {
      const tour = {
        title: faker.helpers.arrayElement([
          `Khám phá ${destination.name} - ${faker.commerce.productAdjective()} ${faker.commerce.productName()}`,
          `Tour ${destination.name} ${faker.number.int({ min: 1, max: 7 })} ngày`,
          `${faker.commerce.productAdjective()} ${destination.name} Experience`,
        ]),
        price: faker.number.int({ min: 500000, max: 5000000 }),
        duration: `${faker.number.int({ min: 1, max: 7 })} ngày ${faker.number.int({ min: 0, max: 1 })} đêm`,
        maxGroupSize: faker.number.int({ min: 10, max: 50 }),
        description: faker.lorem.paragraphs(2),
        itinerary: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, index) => ({
          day: index + 1,
          title: `Ngày ${index + 1}: ${faker.lorem.words(3)}`,
          description: faker.lorem.sentence(),
        })),
        inclusions: faker.helpers.arrayElements([
          'Xe đưa đón',
          'Hướng dẫn viên',
          'Bữa ăn',
          'Vé tham quan',
          'Khách sạn',
          'Bảo hiểm du lịch'
        ], { min: 3, max: 6 }),
        exclusions: faker.helpers.arrayElements([
          'Đồ uống',
          'Chi phí cá nhân',
          'Tiền boa',
          'Vé máy bay'
        ], { min: 1, max: 3 }),
        isSustainable: faker.datatype.boolean(),
        destination: destination._id,
        owner: owner._id,
        status: 'published' as const,
        mainImage: faker.image.urlLoremFlickr({ category: 'travel' }),
        imageGallery: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => 
          faker.image.urlLoremFlickr({ category: 'travel' })
        ),
      };
      
      toursData.push(tour);
    }
  }

  const createdTours = await Tour.insertMany(toursData);
  console.log(`✅ Created ${createdTours.length} tours`);
  return createdTours;
}

async function createBookings(users: any[], tours: any[]) {
  console.log('📅 Creating bookings...');
  
  const customerUsers = users.filter(user => user.role === 'user');
  const bookingsData = [];
  
  for (const tour of tours) {
    // Create 1-3 bookings per tour
    const bookingCount = faker.number.int({ min: 1, max: 3 });
    
    for (let i = 0; i < bookingCount; i++) {
      const user = faker.helpers.arrayElement(customerUsers);
      const participants = faker.number.int({ min: 1, max: 6 });
      const totalPrice = tour.price * participants;
      
      const booking = {
        user: user._id,
        tour: tour._id,
        tourInfo: {
          title: tour.title,
          price: tour.price,
          duration: tour.duration,
        },
        bookingDate: faker.date.future({ years: 1 }),
        participants,
        participantsBreakdown: {
          adults: Math.floor(participants * 0.8),
          children: Math.ceil(participants * 0.2),
        },
        totalPrice,
        status: faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled'] as const),
        paymentMethod: faker.helpers.arrayElement(['credit_card', 'bank_transfer', 'cash']),
        priceBreakdown: {
          basePrice: totalPrice * 0.8,
          taxes: totalPrice * 0.1,
          fees: totalPrice * 0.1,
        },
        history: [
          {
            at: new Date(),
            action: 'Booking created',
            by: user._id,
            note: 'Initial booking',
          },
        ],
      };
      
      bookingsData.push(booking);
    }
  }

  const createdBookings = await Booking.insertMany(bookingsData);
  console.log(`✅ Created ${createdBookings.length} bookings`);
  return createdBookings;
}

async function createReviews(users: any[], bookings: any[]) {
  console.log('⭐ Creating reviews...');
  
  const customerUsers = users.filter(user => user.role === 'user');
  const reviewsData = [];
  
  for (const booking of bookings) {
    // 70% chance of creating a review
    if (faker.datatype.boolean({ probability: 0.7 })) {
      const review = {
        user: booking.user,
        tour: booking.tour,
        rating: faker.number.int({ min: 3, max: 5 }), // Bias towards positive reviews
        comment: faker.helpers.arrayElement([
          'Trải nghiệm tuyệt vời! Tôi rất hài lòng với chuyến đi này.',
          'Hướng dẫn viên rất nhiệt tình và chuyên nghiệp.',
          'Địa điểm đẹp, ẩm thực ngon, con người thân thiện.',
          'Chuyến đi đáng nhớ, tôi sẽ quay lại vào lần sau.',
          'Giá cả hợp lý, chất lượng dịch vụ tốt.',
        ]),
        status: 'approved' as const,
      };
      
      reviewsData.push(review);
    }
  }

  const createdReviews = await Review.insertMany(reviewsData);
  console.log(`✅ Created ${createdReviews.length} reviews`);
  return createdReviews;
}

async function createStories(users: any[], destinations: any[]) {
  console.log('📖 Creating stories...');
  
  const customerUsers = users.filter(user => user.role === 'user');
  const storiesData = [];
  
  // Create 10 stories
  for (let i = 0; i < 10; i++) {
    const author = faker.helpers.arrayElement(customerUsers);
    const destination = faker.helpers.arrayElement(destinations);
    
    // Randomly select other users to like the story
    const otherUsers = customerUsers.filter(user => user._id.toString() !== author._id.toString());
    const likeCount = faker.number.int({ min: 0, max: Math.min(5, otherUsers.length) });
    const likes = faker.helpers.arrayElements(otherUsers, { min: 0, max: likeCount }).map(user => user._id);
    
    const story = {
      author: author._id,
      destination: destination._id,
      title: faker.helpers.arrayElement([
        `Hành trình khám phá ${destination.name} - ${faker.lorem.words(3)}`,
        `Kỷ niệm đáng nhớ tại ${destination.name}`,
        `${destination.name} qua góc nhìn của tôi`,
        `Tips du lịch ${destination.name} từ trải nghiệm thực tế`,
        `Những khoảnh khắc đẹp tại ${destination.name}`,
      ]),
      content: faker.lorem.paragraphs(3),
      coverImage: faker.image.urlLoremFlickr({ category: 'travel' }),
      tags: faker.helpers.arrayElements([
        'du lịch', 'khám phá', 'văn hóa', 'ẩm thực', 'phong cảnh', 
        'trải nghiệm', 'hành trình', 'kỷ niệm', 'địa điểm', 'mẹo du lịch'
      ], { min: 3, max: 6 }),
      likes,
      status: 'approved' as const,
    };
    
    storiesData.push(story);
  }

  const createdStories = await Story.insertMany(storiesData);
  console.log(`✅ Created ${createdStories.length} stories`);
  return createdStories;
}

async function createItineraries(users: any[], destinations: any[]) {
  console.log('🗓️ Creating itineraries...');
  
  const customerUsers = users.filter(user => user.role === 'user');
  const itinerariesData = [];
  
  // Create 5 itineraries
  for (let i = 0; i < 5; i++) {
    const user = faker.helpers.arrayElement(customerUsers);
    const destination = faker.helpers.arrayElement(destinations);
    const days = faker.number.int({ min: 2, max: 4 });
    
    const schedule = Array.from({ length: days }, (_, dayIndex) => ({
      day: dayIndex + 1,
      activities: faker.helpers.arrayElements([
        'Ăn sáng tại khách sạn',
        'Tham quan điểm du lịch chính',
        'Ăn trưa tại nhà hàng địa phương',
        'Khám phá văn hóa địa phương',
        'Mua sắm đồ lưu niệm',
        'Thưởng thức ẩm thực đặc sản',
        'Chụp ảnh tại điểm check-in',
        'Tham gia hoạt động ngoài trời',
        'Nghỉ ngơi và thư giãn',
        'Ăn tối và giao lưu với người dân địa phương'
      ], { min: 4, max: 6 }),
    }));
    
    const itinerary = {
      user: user._id,
      name: `Kế hoạch du lịch ${destination.name} ${days} ngày`,
      startDate: faker.date.future({ years: 1 }),
      endDate: faker.date.future({ years: 1 }),
      status: faker.helpers.arrayElement(['draft', 'published'] as const),
      schedule,
    };
    
    itinerariesData.push(itinerary);
  }

  const createdItineraries = await Itinerary.insertMany(itinerariesData);
  console.log(`✅ Created ${createdItineraries.length} itineraries`);
  return createdItineraries;
}

async function createBadges() {
  console.log('🏆 Creating badges...');
  
  const badgesData = [
    {
      name: 'First Adventure',
      description: 'Hoàn thành chuyến du lịch đầu tiên của bạn',
      iconUrl: 'https://img.icons8.com/color/96/000000/compass.png',
      criteria: 'booking_count:1',
    },
    {
      name: 'Top Reviewer',
      description: 'Viết 5 đánh giá hữu ích',
      iconUrl: 'https://img.icons8.com/color/96/000000/star.png',
      criteria: 'review_count:5',
    },
    {
      name: 'Community Storyteller',
      description: 'Đăng câu chuyện đầu tiên của bạn',
      iconUrl: 'https://img.icons8.com/color/96/000000/book.png',
      criteria: 'story_count:1',
    },
    {
      name: 'Frequent Traveler',
      description: 'Hoàn thành 10 chuyến du lịch',
      iconUrl: 'https://img.icons8.com/color/96/000000/airplane-mode-on.png',
      criteria: 'booking_count:10',
    },
    {
      name: 'Local Expert',
      description: 'Viết đánh giá cho 3 địa điểm khác nhau',
      iconUrl: 'https://img.icons8.com/color/96/000000/map-marker.png',
      criteria: 'unique_destinations:3',
    },
  ];

  const createdBadges = await Badge.insertMany(badgesData);
  console.log(`✅ Created ${createdBadges.length} badges`);
  return createdBadges;
}

async function awardUserBadges(users: any[], badges: any[]) {
  console.log('🎖️ Awarding badges to users...');
  
  const customerUsers = users.filter(user => user.role === 'user');
  const userBadgesData = [];
  
  for (const user of customerUsers) {
    // Check for First Adventure badge
    const bookingCount = await Booking.countDocuments({ user: user._id });
    const firstAdventureBadge = badges.find(b => b.name === 'First Adventure');
    if (bookingCount >= 1 && firstAdventureBadge) {
      userBadgesData.push({
        user: user._id,
        badge: firstAdventureBadge._id,
        earnedAt: new Date(),
      });
    }
    
    // Check for Frequent Traveler badge
    const frequentTravelerBadge = badges.find(b => b.name === 'Frequent Traveler');
    if (bookingCount >= 10 && frequentTravelerBadge) {
      userBadgesData.push({
        user: user._id,
        badge: frequentTravelerBadge._id,
        earnedAt: new Date(),
      });
    }
    
    // Check for Top Reviewer badge
    const reviewCount = await Review.countDocuments({ user: user._id });
    const topReviewerBadge = badges.find(b => b.name === 'Top Reviewer');
    if (reviewCount >= 5 && topReviewerBadge) {
      userBadgesData.push({
        user: user._id,
        badge: topReviewerBadge._id,
        earnedAt: new Date(),
      });
    }
    
    // Check for Community Storyteller badge
    const storyCount = await Story.countDocuments({ author: user._id });
    const storytellerBadge = badges.find(b => b.name === 'Community Storyteller');
    if (storyCount >= 1 && storytellerBadge) {
      userBadgesData.push({
        user: user._id,
        badge: storytellerBadge._id,
        earnedAt: new Date(),
      });
    }
    
    // Check for Local Expert badge
    const uniqueDestinations = await Review.aggregate([
      { $match: { user: user._id } },
      { $lookup: { from: 'tours', localField: 'tour', foreignField: '_id', as: 'tourInfo' } },
      { $unwind: '$tourInfo' },
      { $group: { _id: '$tourInfo.destination' } },
      { $count: 'uniqueDestinations' }
    ]);
    
    const localExpertBadge = badges.find(b => b.name === 'Local Expert');
    if (uniqueDestinations.length > 0 && uniqueDestinations[0].uniqueDestinations >= 3 && localExpertBadge) {
      userBadgesData.push({
        user: user._id,
        badge: localExpertBadge._id,
        earnedAt: new Date(),
      });
    }
  }

  if (userBadgesData.length > 0) {
    const createdUserBadges = await UserBadge.insertMany(userBadgesData);
    console.log(`✅ Awarded ${createdUserBadges.length} badges to users`);
  } else {
    console.log('ℹ️ No badges were awarded (users may not meet criteria yet)');
  }
}

async function createNotifications(users: any[]) {
  console.log('🔔 Creating notifications...');
  
  const customerUsers = users.filter(user => user.role === 'user');
  const notificationsData = [];
  
  for (const user of customerUsers) {
    // Create different types of notifications
    const notificationTypes = [
      {
        type: 'booking_confirmed',
        message: 'Chuyến du lịch của bạn đã được xác nhận! Hãy chuẩn bị cho hành trình sắp tới.',
        link: '/bookings',
      },
      {
        type: 'badge_earned',
        message: 'Chúc mừng! Bạn đã nhận được huy hiệu mới. Hãy kiểm tra hồ sơ của bạn.',
        link: '/profile',
      },
      {
        type: 'promotion',
        message: 'Ưu đãi đặc biệt! Giảm 20% cho chuyến du lịch tiếp theo của bạn.',
        link: '/tours',
      },
      {
        type: 'system_alert',
        message: 'Hệ thống sẽ bảo trì vào ngày mai từ 2:00 - 4:00 sáng. Xin lỗi vì sự bất tiện.',
        link: null,
      },
    ];
    
    // Randomly select 1-3 notifications per user
    const userNotifications = faker.helpers.arrayElements(notificationTypes, { min: 1, max: 3 });
    
    for (const notificationType of userNotifications) {
      const notification = {
        recipient: user._id,
        type: notificationType.type,
        message: notificationType.message,
        link: notificationType.link,
        isRead: faker.datatype.boolean({ probability: 0.3 }), // 30% chance of being read
      };
      
      notificationsData.push(notification);
    }
  }

  const createdNotifications = await Notification.insertMany(notificationsData);
  console.log(`✅ Created ${createdNotifications.length} notifications`);
  return createdNotifications;
}

async function importData() {
  try {
    console.log('🚀 Starting comprehensive data seeding...');
    
    // Phase 1: Core Data
    console.log('\n📊 Phase 1: Creating core data...');
    const createdUsers = await createUsers();
    const createdDestinations = await createDestinations();
    const createdTours = await createTours(createdUsers, createdDestinations);
    const createdBookings = await createBookings(createdUsers, createdTours);
    await createReviews(createdUsers, createdBookings);

    // Phase 2: Ancillary Data
    console.log('\n🎯 Phase 2: Creating ancillary data...');
    await createStories(createdUsers, createdDestinations);
    await createItineraries(createdUsers, createdDestinations);
    const createdBadges = await createBadges();
    await awardUserBadges(createdUsers, createdBadges);
    await createNotifications(createdUsers);

    console.log('\n🎉 All data seeded successfully!');
    console.log('\n📈 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   🗺️ Destinations: ${createdDestinations.length}`);
    console.log(`   🚢 Tours: ${createdTours.length}`);
    console.log(`   📅 Bookings: ${createdBookings.length}`);
    console.log(`   ⭐ Reviews: ${createdBookings.length * 0.7 | 0} (estimated)`);
    console.log(`   📖 Stories: 10`);
    console.log(`   🗓️ Itineraries: 5`);
    console.log(`   🏆 Badges: 5`);
    console.log(`   🔔 Notifications: ${createdUsers.filter(u => u.role === 'user').length * 2 | 0} (estimated)`);
    
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    throw error;
  }
}

async function destroyData() {
  try {
    console.log('🗑️ Destroying all data...');
    
    await Notification.deleteMany({});
    await UserBadge.deleteMany({});
    await Badge.deleteMany({});
    await Itinerary.deleteMany({});
    await Story.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    await Tour.deleteMany({});
    await Destination.deleteMany({});
    await User.deleteMany({});
    
    console.log('✅ All data destroyed successfully!');
  } catch (error) {
    console.error('❌ Error during data destruction:', error);
    throw error;
  }
}

async function run() {
  try {
    console.log('🔌 Connecting to database...');
    await dbConnect();
    
    const command = process.argv[2];
    
    if (command === '--import') {
      await importData();
    } else if (command === '--destroy') {
      await destroyData();
    } else {
      console.log('Usage: npm run seed:import or npm run seed:destroy');
      console.log('  --import: Seed all data');
      console.log('  --destroy: Remove all seeded data');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
run(); 