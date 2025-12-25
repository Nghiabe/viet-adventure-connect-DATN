import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['booking', 'system', 'promotion', 'alert'],
        default: 'system'
    },
    link: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
