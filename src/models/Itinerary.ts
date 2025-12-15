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
  status?: 'draft' | 'published' | 'archived' | 'saved';
  schedule?: ItineraryScheduleItem[];
  sharedWith?: Array<{ user: Types.ObjectId; permission: 'view' | 'edit' }>;
  pendingInvites?: Array<{ email?: string; token: string; permission: 'view' | 'edit'; expiresAt: Date }>;
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
    status: { type: String, enum: ['draft', 'published', 'archived', 'saved'], default: 'draft' },
    schedule: [
      {
        day: { type: Number, required: true },
        activities: [{ type: String }],
      },
    ],
    sharedWith: [{
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      permission: { type: String, enum: ['view', 'edit'], default: 'view' }
    }],
    pendingInvites: [{
      email: { type: String },
      token: { type: String },
      permission: { type: String, enum: ['view', 'edit'], default: 'view' },
      expiresAt: { type: Date }
    }],
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

// Force recompilation of model to pick up schema changes in dev
if (mongoose.models.Itinerary) {
  delete mongoose.models.Itinerary;
}

const Itinerary: Model<ItineraryDocument> = mongoose.model<ItineraryDocument>('Itinerary', ItinerarySchema);

export default Itinerary;



























