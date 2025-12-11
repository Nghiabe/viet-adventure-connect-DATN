import mongoose, { Schema, Document, Model } from 'mongoose';

export interface BadgeDocument extends Document {
  name: string;
  description?: string;
  iconUrl?: string;
  category: 'Du lịch' | 'Xã hội' | 'Thành tựu';
  criteria?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema = new Schema<BadgeDocument>(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    iconUrl: { type: String },
    category: { type: String, enum: ['Du lịch', 'Xã hội', 'Thành tựu'], required: true, index: true },
    criteria: { type: String },
  },
  { timestamps: true }
);

const Badge: Model<BadgeDocument> = mongoose.models.Badge || mongoose.model<BadgeDocument>('Badge', BadgeSchema);

export default Badge;
































