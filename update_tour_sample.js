
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
        if (!tour) {
            console.log('Tour not found');
            process.exit(0);
        }

        console.log('Found Tour:', tour.title);

        // Add sample itinerary
        tour.itinerary = [
            { day: 1, title: 'Đón sân bay - Sơn Trà', description: 'Xe đón quý khách tại sân bay Đà Nẵng, tham quan Bán đảo Sơn Trà, viếng Linh Ứng Tự.' },
            { day: 2, title: 'Bà Nà Hills - Tắm biển', description: 'Khởi hành đi Bà Nà Hills, trải nghiệm Cáp treo đạt kỷ lục thế giới. Chiều tắm biển Mỹ Khê.' }
        ];

        // Add sample image if missing (to make it look good)
        if (!tour.mainImage) {
            tour.mainImage = 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80';
        }

        // Add sample route if missing
        if (!tour.route) {
            tour.route = 'Đà Nẵng -> Sơn Trà -> Bà Nà -> Hội An';
        }

        // Add sample highlights
        if (!tour.highlights || tour.highlights.length === 0) {
            tour.highlights = ['Cầu Rồng', 'Biển Mỹ Khê', 'Bà Nà Hills'];
        }

        await tour.save();
        console.log('Updated tour with sample itinerary, image, route, and highlights.');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
