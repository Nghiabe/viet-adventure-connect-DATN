
import mongoose from 'mongoose';
import Tour from './server/models/Tour.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const tour = await Tour.findOne({ title: { $regex: 'mnkjhgf', $options: 'i' } });
        console.log('Found Tour:', tour ? tour.title : 'Not Found');
        if (tour) {
            console.log('Main Image:', tour.mainImage);
            console.log('Image Gallery:', JSON.stringify(tour.imageGallery, null, 2));
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
