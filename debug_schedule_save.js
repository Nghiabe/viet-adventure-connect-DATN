
import mongoose from 'mongoose';
import Tour from './server/models/Tour.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // Find the tour "mnkjhgf" seen in the screenshot
        const tour = await Tour.findOne({ title: { $regex: 'mnkjhgf', $options: 'i' } });
        console.log('Found Tour:', tour ? tour.title : 'Not Found');
        if (tour) {
            console.log('Schedule:', JSON.stringify(tour.schedule, null, 2));
            // Also check if field exists in the document (it might be undefined if not in schema)
            console.log('Raw Schedule Field:', tour.toObject().schedule);
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
