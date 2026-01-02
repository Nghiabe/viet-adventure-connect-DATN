
import mongoose from 'mongoose';
import Tour from './models/Tour.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const tour = await Tour.findOne({ title: { $regex: 'Tour Đà Nẵng 2 Ngày 1 Đêm', $options: 'i' } });
        console.log('Found Tour:', tour ? tour.title : 'Not Found');
        if (tour) {
            console.log('Itinerary:', JSON.stringify(tour.itinerary, null, 2));
            console.log('Schedule:', JSON.stringify(tour.schedule, null, 2)); // Check if this field exists
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
