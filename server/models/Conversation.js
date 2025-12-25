
import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        index: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        text: String,
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: Date
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

// Ensure one conversation per booking
ConversationSchema.index({ booking: 1 }, { unique: true });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
export default Conversation;
