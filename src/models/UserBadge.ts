import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface UserBadgeDocument extends Document {
  user: Types.ObjectId;
  badge: Types.ObjectId;
  earnedAt: Date;
}

const UserBadgeSchema = new Schema<UserBadgeDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  badge: { type: Schema.Types.ObjectId, ref: 'Badge', required: true, index: true },
  earnedAt: { type: Date, default: Date.now },
});

// Prevent duplicate user-badge relations
UserBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

const UserBadge: Model<UserBadgeDocument> =
  mongoose.models.UserBadge || mongoose.model<UserBadgeDocument>('UserBadge', UserBadgeSchema);

export default UserBadge;

























































