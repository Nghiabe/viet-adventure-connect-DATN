import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import Tour from './Tour';

export interface ReviewDocument extends Document {
  user: Types.ObjectId;
  tour: Types.ObjectId;
  rating: number; // 1..5
  comment?: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewModel extends Model<ReviewDocument> {
  calculateAverageRating(tourId: Types.ObjectId): Promise<void>;
}

const ReviewSchema = new Schema<ReviewDocument, ReviewModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tour: { type: Schema.Types.ObjectId, ref: 'Tour', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Compound index: one review per user per tour
ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });

ReviewSchema.statics.calculateAverageRating = async function (tourId: Types.ObjectId) {
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
  const review = this as ReviewDocument;
  await (review.constructor as ReviewModel).calculateAverageRating(review.tour);
});

ReviewSchema.post('remove', async function () {
  const review = this as ReviewDocument;
  await (review.constructor as ReviewModel).calculateAverageRating(review.tour);
});

const Review: ReviewModel = mongoose.models.Review || mongoose.model<ReviewDocument, ReviewModel>('Review', ReviewSchema);

export default Review;






