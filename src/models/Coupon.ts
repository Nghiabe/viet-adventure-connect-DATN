import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface CouponRules {
  minimumSpend?: number;
  applicableToDestinations?: Types.ObjectId[];
  applicableToPartners?: Types.ObjectId[];
  applicableToTours?: Types.ObjectId[];
}

export interface CouponLimits {
  totalUses?: number;
  usesPerCustomer?: boolean;
}

export interface CouponDocument extends Document {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  rules?: CouponRules;
  limits?: CouponLimits;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  usedCount: number;
  usedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<CouponDocument>({
  code: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  discountType: { type: String, enum: ['percentage', 'fixed_amount'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  rules: {
    minimumSpend: { type: Number, default: 0 },
    applicableToDestinations: [{ type: Schema.Types.ObjectId, ref: 'Destination' }],
    applicableToPartners: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    applicableToTours: [{ type: Schema.Types.ObjectId, ref: 'Tour' }],
  },
  limits: {
    totalUses: { type: Number, default: 0 },
    usesPerCustomer: { type: Boolean, default: false },
  },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true, index: true },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Coupon: Model<CouponDocument> = mongoose.models.Coupon || mongoose.model<CouponDocument>('Coupon', CouponSchema);
export default Coupon;


