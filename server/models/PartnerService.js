import mongoose from 'mongoose';

const PartnerServiceSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['hotel', 'flight', 'train', 'bus'], required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // Base price or starting price
    location: { type: String }, // For hotels mainly (display location)
    address: { type: String }, // Detailed address
    route: { type: String }, // For transport
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    image: { type: String, default: '' }, // Main thumbnail
    images: [String], // Gallery
    description: String,

    // Hotel Specifics
    facilities: [String],
    inclusions: [String],
    exclusions: [String],
    roomTypes: [{
        name: String,
        price: Number,
        description: String,
        amenities: [String],
        images: [String]
    }]
}, { timestamps: true });

const PartnerService = mongoose.models.PartnerService || mongoose.model('PartnerService', PartnerServiceSchema);
export default PartnerService;
