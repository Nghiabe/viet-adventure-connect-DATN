import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export type UserRole = 'user' | 'partner' | 'staff' | 'admin';

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: UserRole;
  status: 'active' | 'pending_approval' | 'suspended';
  savedTours: Types.ObjectId[];
  savedStories: Types.ObjectId[];
  contributionScore?: number;
  preferences: {
    marketingEmails: boolean;
  };
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  createPasswordResetToken(): string;
}

export interface UserModel extends Model<UserDocument> {}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String },
    role: { type: String, enum: ['user', 'partner', 'staff', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'pending_approval', 'suspended'], default: 'active' },
    savedTours: [{ type: Schema.Types.ObjectId, ref: 'Tour' }],
    savedStories: [{ type: Schema.Types.ObjectId, ref: 'Story' }],
    contributionScore: { type: Number, default: 0 },
    preferences: {
      marketingEmails: { type: Boolean, default: true }
    },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

// Password hashing
UserSchema.pre('save', async function (next) {
  const user = this as UserDocument;
  
  // Add a log to confirm the hook is firing
  console.log(`[User Model] 'pre-save' hook triggered for user: ${user.email}`);
  
  if (!user.isModified('password')) {
    console.log('[User Model] Password not modified, skipping hashing.');
    return next();
  }
  
  try {
    console.log('[User Model] Password modified. Hashing password...');
    const saltRounds = 10;
    const hash = await bcrypt.hash(user.password, saltRounds);
    user.password = hash;
    console.log('[User Model] Password successfully hashed.');
    next();
  } catch (err) {
    console.error('[User Model] Error hashing password:', err);
    next(err as Error);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  console.log(`[User Model] Comparing password for user: ${this.email}`);
  console.log(`[User Model] Stored hash: ${this.password}`);
  console.log(`[User Model] Candidate password: ${candidate}`);
  
  const result = await bcrypt.compare(candidate, this.password);
  console.log(`[User Model] Password comparison result: ${result}`);
  
  return result;
};

UserSchema.methods.createPasswordResetToken = function() {
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

const User: UserModel = mongoose.models.User || mongoose.model<UserDocument, UserModel>('User', UserSchema);

export default User;



