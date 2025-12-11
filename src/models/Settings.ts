import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ReferralProgramSettings {
  rewardAmount: number;
  discountPercentage: number;
}

export interface SettingsDocument extends Document {
  referralProgram: ReferralProgramSettings;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralProgramSchema = new Schema<ReferralProgramSettings>({
  rewardAmount: { 
    type: Number, 
    default: 0, 
    min: 0,
    required: true 
  },
  discountPercentage: { 
    type: Number, 
    default: 10, 
    min: 0, 
    max: 100,
    required: true 
  },
});

const SettingsSchema = new Schema<SettingsDocument>({
  referralProgram: {
    type: ReferralProgramSchema,
    default: () => ({})
  },
}, { 
  timestamps: true,
  // Ensure only one settings document exists
  collection: 'settings'
});

// Create a compound index to ensure uniqueness
SettingsSchema.index({}, { unique: true });

const Settings: Model<SettingsDocument> = mongoose.models.Settings || mongoose.model<SettingsDocument>('Settings', SettingsSchema);

export default Settings;


