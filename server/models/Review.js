import mongoose from 'mongoose';
import Tour from './Tour.js';

const ReviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true, index: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
        rejectionReason: { type: String },
    },
    { timestamps: true }
);

// Compound index: one review per user per tour
ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });

ReviewSchema.statics.calculateAverageRating = async function (tourId) {
    const stats = await this.aggregate([
        { $match: { tour: tourId, status: 'approved' } },
        {
            $group: {
                _id: '$tour',
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 },
            },
        },
    ]);

    const averageRating = stats[0]?.averageRating ?? 0;
    const reviewCount = stats[0]?.reviewCount ?? 0;
    await Tour.findByIdAndUpdate(tourId, { averageRating, reviewCount }, { new: true }).exec();
};

ReviewSchema.post('save', async function () {
    await this.constructor.calculateAverageRating(this.tour);
});

ReviewSchema.post('remove', async function () {
    await this.constructor.calculateAverageRating(this.tour);
});

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export default Review;
