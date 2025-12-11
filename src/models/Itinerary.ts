import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ItineraryScheduleItem {
  day: number;
  activities: string[];
}

export interface ItineraryDocument extends Document {
  user: Types.ObjectId;
  name: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'draft' | 'published' | 'archived';
  schedule?: ItineraryScheduleItem[];
  aiPlan?: {
    itineraryName: string;
    schedule: Array<{
      day: number;
      date?: string;
      title: string;
      activities: Array<{ time: string; description: string }>;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ItinerarySchema = new Schema<ItineraryDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    schedule: [
      {
        day: { type: Number, required: true },
        activities: [{ type: String }],
      },
    ],
    aiPlan: {
      itineraryName: { type: String },
      schedule: [
        {
          day: { type: Number, required: true },
          date: { type: String },
          title: { type: String, required: true },
          activities: [
            {
              time: { type: String, required: true },
              description: { type: String, required: true },
            },
          ],
        },
      ],
    },
  },
  { timestamps: true }
);

const Itinerary: Model<ItineraryDocument> = mongoose.models.Itinerary || mongoose.model<ItineraryDocument>('Itinerary', ItinerarySchema);

export default Itinerary;



























