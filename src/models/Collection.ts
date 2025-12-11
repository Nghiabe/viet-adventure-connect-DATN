import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface CollectionDocument extends Document {
  name: string;
  description?: string;
  tours: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<CollectionDocument>({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  tours: [{ type: Schema.Types.ObjectId, ref: 'Tour' }],
}, { timestamps: true });

const Collection: Model<CollectionDocument> = mongoose.models.Collection || mongoose.model<CollectionDocument>('Collection', CollectionSchema);
export default Collection;


