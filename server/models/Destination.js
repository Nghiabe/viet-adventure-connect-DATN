import mongoose from 'mongoose';

const DestinationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    history: String,
    culture: String,
    geography: String,
    mainImage: String,
    imageGallery: [String],
    bestTimeToVisit: [String],
    essentialTips: [String],
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
}, { timestamps: true });

const Destination = mongoose.models.Destination || mongoose.model('Destination', DestinationSchema);
export default Destination;
