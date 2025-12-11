import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface BookingTourSnapshot {
  title: string;
  price: number;
  duration: string;
}

export interface BookingDocument extends Document {
  user: Types.ObjectId;
  tour: Types.ObjectId;
  tourInfo: BookingTourSnapshot;
  bookingDate: Date; // The date the customer will take the tour ("Tour Date")
  participants: number;
  participantsBreakdown?: { adults?: number; children?: number };
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentId?: string;
  paymentMethod?: string;
  paymentTransactionId?: string;
  priceBreakdown?: { basePrice?: number; taxes?: number; fees?: number };
  history?: Array<{ at: Date; action: string; by?: Types.ObjectId; note?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<BookingDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tour: { type: Schema.Types.ObjectId, ref: 'Tour', required: true, index: true },
    tourInfo: {
      title: { type: String, required: true },
      price: { type: Number, required: true },
      duration: { type: String, required: true },
    },
    bookingDate: { type: Date, required: true },
    participants: { type: Number, required: true, min: 1 },
    participantsBreakdown: {
      adults: { type: Number, default: 0 },
      children: { type: Number, default: 0 },
    },
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'refunded'], default: 'pending' },
    paymentId: { type: String },
    paymentMethod: { type: String },
    paymentTransactionId: { type: String },
    priceBreakdown: {
      basePrice: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      fees: { type: Number, default: 0 },
    },
    history: [
      {
        at: { type: Date, default: () => new Date() },
        action: { type: String, required: true },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const Booking: Model<BookingDocument> = mongoose.models.Booking || mongoose.model<BookingDocument>('Booking', BookingSchema);

export default Booking;






