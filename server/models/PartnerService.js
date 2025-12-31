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
    quantity: { type: Number, default: 0 }, // Total availability

    // Hotel Specifics
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    maxGuests: { type: Number, default: 2 },
    facilities: [String],
    inclusions: [String],
    exclusions: [String],
    roomTypes: [{
        name: String,
        price: Number,
        quantity: { type: Number, default: 5 }, // Added quantity field
        maxGuests: { type: Number, default: 2 }, // Added maxGuests per room
        description: String,
        amenities: [String],
        images: [String]
    }],
    // Transport Specifics
    ticketTypes: [{
        name: String,
        price: Number,
        quantity: { type: Number, default: 50 },
        description: String,
        class: { type: String, default: 'Standard' }
    }]
}, { timestamps: true });

const PartnerService = mongoose.models.PartnerService || mongoose.model('PartnerService', PartnerServiceSchema);
export default PartnerService;
