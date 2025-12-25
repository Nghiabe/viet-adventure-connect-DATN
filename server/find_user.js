
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/viet-adventure-connect';

async function debug() {
    try {
        await mongoose.connect(connectionString);
        console.log('Connected to DB');

        const user = await User.findOne();
        if (user) {
            console.log('Fallback User ID:', user._id);
        } else {
            console.log('No users found!');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
