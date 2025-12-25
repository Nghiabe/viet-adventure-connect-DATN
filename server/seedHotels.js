import mongoose from 'mongoose';
import Hotel from './models/Hotel.js';
import dotenv from 'dotenv';

dotenv.config();

const hotels = [
    {
        name: 'Ha Long Luxury Hotel',
        city: 'Hạ Long',
        address: '123 Ha Long Road, Quang Ninh',
        location: 'Near the bay',
        price_per_night: 1500000,
        rating: 4.8,
        stars: 5,
        reviewCount: 120,
        amenities: ['Pool', 'Spa', 'Wifi', 'Breakfast'],
        description: 'Luxury hotel with bay view.',
        images: [{ url: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/484042880.jpg?k=f5a6b7d277259160534282367503940173256191dec3e18f2679a9559c637482&o=&hp=1' }]
    },
    {
        name: 'Da Nang Beach Resort',
        city: 'Đà Nẵng',
        address: '456 Vo Nguyen Giap, Da Nang',
        location: 'My Khe Beach',
        price_per_night: 2500000,
        rating: 4.9,
        stars: 5,
        reviewCount: 300,
        amenities: ['Beachfront', 'Pool', 'Gym', 'Bar'],
        description: 'Beautiful resort right on the beach.',
        images: [{ url: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/412093539.jpg?k=8533169300a89d4436577519a930737397b98cf985392d47cb484cf13c98897c&o=&hp=1' }]
    },
    {
        name: 'Hanoi Old Quarter Homestay',
        city: 'Hà Nội',
        address: '78 Hang Gai, Hanoi',
        location: 'Old Quarter',
        price_per_night: 500000,
        rating: 4.5,
        stars: 3,
        reviewCount: 50,
        amenities: ['Wifi', 'AC'],
        description: 'Cozy homestay in the heart of Hanoi.',
        images: [{ url: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/197116718.jpg?k=55a6d3f2563f6990664426549221237748455577668616140552726354673891&o=&hp=1' }]
    },
    {
        name: 'Saigon Central Hotel',
        city: 'Hồ Chí Minh',
        address: '101 Nguyen Hue, District 1, HCMC',
        location: 'District 1',
        price_per_night: 1200000,
        rating: 4.2,
        stars: 4,
        reviewCount: 150,
        amenities: ['Pool', 'Restaurant', 'Gym'],
        description: 'Modern hotel in the city center.',
        images: [{ url: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/247125340.jpg?k=1264357548545812328701987515438833835616335359368310328906566862&o=&hp=1' }]
    }
];

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(async () => {
            console.log('✅ MongoDB connected');
            await Hotel.deleteMany({ provider: 'local' }); // Clear old seeded data
            await Hotel.insertMany(hotels);
            console.log('✅ Seeded sample hotels');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ MongoDB connection error:', err);
            process.exit(1);
        });
} else {
    console.warn('⚠️ MONGODB_URI not found in .env');
    process.exit(1);
}
