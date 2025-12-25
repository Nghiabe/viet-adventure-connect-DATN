import mongoose from 'mongoose';

const TourSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String },
    description: String,
    price: Number,
    duration: String,
    maxGroupSize: Number,
    highlights: [String],
    route: String,
    tips: String,
    category: String,
    start_dates: [Date],
    inclusions: [String],
    exclusions: [String],
    mainImage: String,
    imageGallery: [String],
    itinerary: [{
        day: Number,
        title: String,
        description: String
    }],
    // We use mixed type for flexible destinations array matching frontend payload
    destinations: [{
        destinationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },
        orderIndex: Number,
        note: String,
        destinationName: String
    }],
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }, // legacy
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' }
}, { timestamps: true });

const Tour = mongoose.models.Tour || mongoose.model('Tour', TourSchema);
export default Tour;
