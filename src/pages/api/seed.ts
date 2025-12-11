/* eslint-disable no-console */
import type { IncomingMessage, ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// Reuse the CLI seeding logic by importing the functions indirectly
import User from '@/models/User';
import Destination from '@/models/Destination';
import Tour from '@/models/Tour';
import Review from '@/models/Review';
import Booking from '@/models/Booking';
import Story from '@/models/Story';
import Badge from '@/models/Badge';
import UserBadge from '@/models/UserBadge';
import { faker } from '@faker-js/faker';

async function destroyData() {
  await Promise.all([
    User.deleteMany({}),
    Destination.deleteMany({}),
    Tour.deleteMany({}),
    Review.deleteMany({}),
    Booking.deleteMany({}),
    Story.deleteMany({}),
    Badge.deleteMany({}),
    UserBadge.deleteMany({}),
  ]);
}

async function seedHandler(req: IncomingMessage, res: ServerResponse) {
  if (process.env.NODE_ENV !== 'development') {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'This API is only available in development mode.' }));
    return;
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
    return;
  }

  try {
    await dbConnect();

    // Import the creation functions inline to avoid duplicating too much logic here
    const createUsers = async () => {
      const users: any[] = [{ name: 'Admin User', email: 'admin@example.com', password: 'Password123!', role: 'admin' }];
      for (let i = 0; i < 3; i += 1) {
        users.push({ name: `${faker.person.fullName()} (Partner)`, email: faker.internet.email().toLowerCase(), password: 'Password123!', role: 'partner' });
      }
      for (let i = 0; i < 9; i += 1) {
        users.push({ name: faker.person.fullName(), email: faker.internet.email().toLowerCase(), password: 'Password123!', role: 'user' });
      }
      return User.insertMany(users);
    };

    const createDestinations = async () => {
      const names = ['Vịnh Hạ Long', 'Phố Cổ Hội An', 'Sa Pa', 'Đồng bằng Sông Cửu Long', 'Phú Quốc'];
      const docs = names.map((name) => ({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description: faker.lorem.paragraph(),
      }));
      return Destination.insertMany(docs);
    };

    const createTours = async (destinations: any[], users: any[]) => {
      const tours: any[] = [];
      const partners = users.filter((u) => u.role === 'partner');
      for (let i = 0; i < 20; i += 1) {
        const dest = destinations[Math.floor(Math.random() * destinations.length)];
        const owner = partners.length ? partners[Math.floor(Math.random() * partners.length)] : users[Math.floor(Math.random() * users.length)];
        tours.push({ title: faker.lorem.words({ min: 2, max: 5 }), destination: dest._id, owner: owner._id, price: faker.number.int({ min: 300000, max: 5000000 }), duration: '2 ngày' });
      }
      return Tour.insertMany(tours);
    };

    const createReviews = async (users: any[], tours: any[]) => {
      const reviews: any[] = [];
      for (let i = 0; i < 50; i += 1) {
        const user = users[Math.floor(Math.random() * users.length)];
        const tour = tours[Math.floor(Math.random() * tours.length)];
        reviews.push({ user: user._id, tour: tour._id, rating: faker.number.int({ min: 1, max: 5 }), comment: faker.lorem.sentence() });
      }
      const unique = Array.from(new Map(reviews.map(r => [`${r.tour}-${r.user}`, r])).values());
      return Review.insertMany(unique, { ordered: false });
    };

    const createBookings = async (users: any[], tours: any[]) => {
      const bookings: any[] = [];
      for (let i = 0; i < 15; i += 1) {
        const user = users[Math.floor(Math.random() * users.length)];
        const tour = tours[Math.floor(Math.random() * tours.length)];
        const participants = faker.number.int({ min: 1, max: 5 });
        const price = tour.price;
        bookings.push({
          user: user._id,
          tour: tour._id,
          tourInfo: { title: tour.title, price, duration: tour.duration },
          bookingDate: faker.date.soon({ days: 90 }),
          participants,
          totalPrice: price * participants,
          status: 'confirmed',
        });
      }
      return Booking.insertMany(bookings);
    };

    const createStories = async (users: any[], destinations: any[]) => {
      const stories: any[] = [];
      for (let i = 0; i < 10; i += 1) {
        const author = users[Math.floor(Math.random() * users.length)];
        const dest = destinations[Math.floor(Math.random() * destinations.length)];
        stories.push({ author: author._id, destination: dest._id, title: faker.lorem.sentence(), content: faker.lorem.paragraph() });
      }
      return Story.insertMany(stories);
    };

    const createBadgesAndUserBadges = async (users: any[]) => {
      const badges = await Badge.insertMany([
        { name: 'First Booking' },
        { name: 'Top Reviewer' },
        { name: 'Community Pioneer' },
      ]);
      const userBadges = users.slice(0, 5).map((u: any, i: number) => ({ user: u._id, badge: badges[i % badges.length]._id }));
      await UserBadge.insertMany(userBadges);
    };

    await destroyData();
    const users = await createUsers();
    const destinations = await createDestinations();
    const tours = await createTours(destinations, users);
    await createReviews(users, tours);
    await createBookings(users, tours);
    await createStories(users, destinations);
    await createBadgesAndUserBadges(users);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, message: 'Database seeded successfully via API!' }));
  } catch (err: any) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: `Seeding failed: ${err.message}` }));
  } finally {
    await mongoose.connection.close();
  }
}

export default seedHandler;





