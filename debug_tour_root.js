
import mongoose from 'mongoose';
import Tour from './server/models/Tour.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('No MONGODB_URI in env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        const tour = await Tour.findOne({ title: { $regex: 'Tour Đà Nẵng 2 Ngày 1 Đêm', $options: 'i' } });
        console.log('Found Tour:', tour ? tour.title : 'Not Found');
        if (tour) {
            console.log('Itinerary Length:', tour.itinerary ? tour.itinerary.length : 0);
            console.log('Itinerary Data:', JSON.stringify(tour.itinerary, null, 2));
            console.log('Schedule:', JSON.stringify(tour.schedule, null, 2));
            console.log('Main Image:', tour.mainImage);
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
