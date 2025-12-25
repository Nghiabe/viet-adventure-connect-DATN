import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        password: { type: String, required: true, minlength: 6 },
        avatar: { type: String },
        role: { type: String, enum: ['user', 'partner', 'staff', 'admin'], default: 'user' },
        status: { type: String, enum: ['active', 'pending_approval', 'suspended'], default: 'active' },
        savedTours: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }],
        savedStories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }],
        contributionScore: { type: Number, default: 0 },
        preferences: {
            marketingEmails: { type: Boolean, default: true }
        },
        passwordResetToken: { type: String },
        passwordResetExpires: { type: Date },
        partnerProfile: {
            companyName: { type: String },
            description: { type: String },
            website: { type: String },
            phoneNumber: { type: String },
            address: { type: String },
            logo: { type: String },
            bankName: { type: String },
            bankAccountName: { type: String },
            bankAccountNumber: { type: String },
            emailNotifications: { type: Boolean, default: true },
            bookingAlerts: { type: Boolean, default: true }
        }
    },
    { timestamps: true }
);

// Password hashing
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(this.password, saltRounds);
        this.password = hash;
        next();
    } catch (err) {
        next(err);
    }
});

UserSchema.methods.comparePassword = async function (candidate) {
    return await bcrypt.compare(candidate, this.password);
};

UserSchema.methods.createPasswordResetToken = function () {
    // 1. Generate the raw token (what the user sees)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash the token before saving it to the database (what we store)
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 3. Set an expiry time (e.g., 10 minutes)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    // 4. Return the raw, unhashed token to be sent via email
    return resetToken;
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
