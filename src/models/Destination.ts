import mongoose, { Schema, Document, Model } from 'mongoose';

export interface DestinationDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  history?: string;
  culture?: string;
  geography?: string;
  mainImage?: string;
  imageGallery?: string[];
  bestTimeToVisit?: string[];
  essentialTips?: string[];
  status?: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

const DestinationSchema = new Schema<DestinationDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    history: { type: String },
    culture: { type: String },
    geography: { type: String },
    mainImage: { type: String },
    imageGallery: [{ type: String }],
    bestTimeToVisit: [{ type: String }],
    essentialTips: [{ type: String }],
    status: { type: String, enum: ['draft','published'], default: 'draft', index: true },
  },
  { timestamps: true }
);

const Destination: Model<DestinationDocument> =
  mongoose.models.Destination || mongoose.model<DestinationDocument>('Destination', DestinationSchema);

export default Destination;






