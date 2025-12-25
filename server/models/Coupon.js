import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    discountType: { type: String, enum: ['percentage', 'fixed_amount'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    rules: {
        minimumSpend: { type: Number, default: 0 },
        applicableToDestinations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }],
        applicableToPartners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        applicableToTours: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }],
    },
    limits: {
        totalUses: { type: Number, default: 0 },
        usesPerCustomer: { type: Boolean, default: false },
    },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
export default Coupon;
