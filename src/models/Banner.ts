import mongoose, { Schema, Document, Model } from 'mongoose';

export interface BannerDocument extends Document {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<BannerDocument>({
  imageUrl: { type: String, required: true },
  title: { type: String },
  subtitle: { type: String },
  linkUrl: { type: String },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0, index: true },
}, { timestamps: true });

const Banner: Model<BannerDocument> = mongoose.models.Banner || mongoose.model<BannerDocument>('Banner', BannerSchema);
export default Banner;


