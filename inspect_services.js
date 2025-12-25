import mongoose from 'mongoose';
import PartnerService from './server/models/PartnerService.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const services = await PartnerService.find({ type: { $in: ['flight', 'train', 'bus'] } }).limit(5);
        console.log('Found services:', services.length);
        services.forEach(s => {
            console.log(JSON.stringify({
                id: s._id,
                type: s.type,
                name: s.name,
                route: s.route
            }, null, 2));
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
