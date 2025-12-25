import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

        // Polymorphic reference: Can be Tour OR PartnerService (Hotel/Transport) OR Story
        type: { type: String, enum: ['tour', 'hotel', 'flight', 'train', 'bus', 'story'], default: 'tour' },

        tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }, // Optional if type != tour
        story: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' }, // For Story inquiries
        partnerService: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerService' }, // For Hotels

        // Generic service info snapshot
        serviceInfo: {
            title: { type: String, required: true }, // Hotel or Tour name
            price: { type: Number, required: true }, // Unit price
            duration: { type: String }, // For tours

            // Snapshot Fields
            image: { type: String },
            destination: { type: String },

            // Hotel specifics
            checkIn: Date,
            checkOut: Date,
            nights: Number,
            roomType: String,
            roomType: String,
            providerUrl: String,

            // Flight specifics
            airline: String,
            flightNumber: String,
            location: String, // e.g., "HAN - SGN"
            tripTime: String  // e.g., "HH:mm"
        },

        bookingDate: { type: Date, default: Date.now }, // Created At basically
        checkInDate: { type: Date }, // Specific for filtering

        participants: { type: Number, required: true, min: 1 },
        participantsBreakdown: {
            adults: { type: Number, default: 0 },
            children: { type: Number, default: 0 },
        },

        totalPrice: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'refunded', 'provisional'], default: 'pending' },

        paymentId: { type: String },
        paymentMethod: { type: String },
        paymentTransactionId: { type: String },

        contactInfo: {
            name: String,
            email: String,
            phone: String
        },

        priceBreakdown: {
            basePrice: { type: Number, default: 0 },
            taxes: { type: Number, default: 0 },
            fees: { type: Number, default: 0 },
        },
        history: [
            {
                at: { type: Date, default: () => new Date() },
                action: { type: String, required: true },
                by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                note: { type: String },
            },
        ],
    },
    { timestamps: true }
);

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

export default Booking;
