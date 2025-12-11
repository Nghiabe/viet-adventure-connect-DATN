import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface StoryDocument extends Document {
  author: Types.ObjectId;
  destination?: Types.ObjectId;
  title: string;
  content: string;
  coverImage?: string;
  tags: string[];
  likes: Types.ObjectId[];
  likeCount: number;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema = new Schema<StoryDocument>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    destination: { type: Schema.Types.ObjectId, ref: 'Destination' },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String },
    tags: [{ type: String, index: true }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Maintain likeCount derived from likes array length
StorySchema.pre('save', function (next) {
  const story = this as StoryDocument;
  if (story.isModified('likes')) {
    story.likeCount = story.likes.length;
  }
  next();
});

const Story: Model<StoryDocument> = mongoose.models.Story || mongoose.model<StoryDocument>('Story', StorySchema);

export default Story;






