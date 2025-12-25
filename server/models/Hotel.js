import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String },
    location: { type: String }, // General location description

    // Pricing
    price_per_night: { type: Number, required: true },
    currency: { type: String, default: 'VND' },

    // Ratings
    rating: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    // Details
    amenities: [{ type: String }],
    description: { type: String },
    images: [{
        url: String,
        thumbnail: String,
        caption: String
    }],

    // Geolocation
    coordinates: {
        lat: Number,
        lng: Number
    },

    // Metadata
    provider: { type: String, default: 'local' },
    createdAt: { type: Date, default: Date.now }
});

// Index for search
hotelSchema.index({ name: 'text', city: 'text', address: 'text' });
hotelSchema.index({ price_per_night: 1 });
hotelSchema.index({ rating: -1 });

const Hotel = mongoose.model('Hotel', hotelSchema);

export default Hotel;
