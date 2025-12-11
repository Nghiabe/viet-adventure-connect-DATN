import mongoose, { Schema, Document, Model } from 'mongoose';

export interface RoleDocument extends Document {
  name: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<RoleDocument>({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: String }],
}, { timestamps: true });

const Role: Model<RoleDocument> = mongoose.models.Role || mongoose.model<RoleDocument>('Role', RoleSchema);
export default Role;


