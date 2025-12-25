
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import Tour from './models/Tour.js';
import PartnerService from './models/PartnerService.js';
import Conversation from './models/Conversation.js';

dotenv.config();

const connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/viet-adventure-connect';

async function debug() {
    try {
        await mongoose.connect(connectionString);
        console.log('Connected to DB');

        const bookingId = '694baa4e632278c9e2a270b3'; // From screenshot

        const rawBooking = await Booking.findById(bookingId);
        console.log('Raw Booking:', rawBooking);

        const booking = await Booking.findById(bookingId)
            .populate('tour')
            .populate('partnerService');

        if (!booking) {
            console.log('Booking NOT found!');
            process.exit(1);
        }

        console.log('Booking found:', booking._id);
        console.log('Type:', booking.type);

        let providerId;
        if (booking.tour?.owner) {
            console.log('Tour Owner:', booking.tour.owner);
            providerId = booking.tour.owner;
        } else if (booking.partnerService?.owner) {
            console.log('PartnerService Owner:', booking.partnerService.owner);
            providerId = booking.partnerService.owner;
        } else {
            console.log('NO OWNER FOUND in Tour or PartnerService!');
            console.log('Tour:', booking.tour);
            console.log('PartnerService:', booking.partnerService);
        }

        const convo = await Conversation.findOne({ booking: bookingId });
        console.log('Existing Conversation:', convo);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
