import mongoose from 'mongoose';

const DestinationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    // Detailed Content
    history: String,
    culture: String,
    geography: String,

    // Images
    mainImage: String,
    imageGallery: [String], // Array of image URLs

    // Travel Info
    bestTimeToVisit: [String], // Array of months or descriptions
    essentialTips: [String], // Tips for travelers

    // Status & Flags
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },

    // Location Data (for Map)
    location: {
        lat: Number,
        lng: Number,
        address: String
    }
}, { timestamps: true });

// Add index for search performance
DestinationSchema.index({ name: 'text', description: 'text', slug: 1 });

const Destination = mongoose.models.Destination || mongoose.model('Destination', DestinationSchema);
export default Destination;
