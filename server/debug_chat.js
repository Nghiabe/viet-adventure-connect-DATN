
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from one level up
dotenv.config({ path: path.join(__dirname, '../.env') });

const BookingId = process.argv[2];

if (!BookingId) {
    console.error('Please provide a booking ID');
    process.exit(1);
}

const run = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Dynamically import models to ensure schemas are registered
        const { default: Conversation } = await import('./models/Conversation.js');
        const { default: Message } = await import('./models/Message.js');

        console.log(`Searching for Conversation with booking: ${BookingId}`);
        const conversation = await Conversation.findOne({ booking: BookingId });

        if (!conversation) {
            console.log('No conversation found for this booking.');
        } else {
            console.log('Found Conversation:', JSON.stringify(conversation, null, 2));
            console.log(`Searching for Messages with conversation: ${conversation._id}`);
            const messages = await Message.find({ conversation: conversation._id });
            console.log(`Found ${messages.length} messages.`);
            console.log(JSON.stringify(messages, null, 2));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

run();
