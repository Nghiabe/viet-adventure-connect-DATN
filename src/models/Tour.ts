import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Enriched Tour Model
 * 
 * Synced with AI Agent output format for seamless data flow:
 * AI Scrape → MongoDB → Frontend
 */

// ============== Interfaces ==============

export interface TourImage {
  url: string;
  thumbnail?: string;
  caption?: string;
}

export interface TourSchedule {
  morning?: string;
  afternoon?: string;
  evening?: string;
}

export interface TourItineraryItem {
  day: number;
  title: string;
  description: string;
}

export interface TourDestinationItem {
  destinationId: Types.ObjectId;
  orderIndex: number;
  note?: string;
  name?: string;
  destinationName?: string;
}

export type TourCategory = 'tham_quan' | 'am_thuc' | 'van_hoa' | 'trai_nghiem' | 'phieu_luu';
export type TourSource = 'web_scrape' | 'user_created' | 'partner';
export type TourStatus = 'draft' | 'published' | 'archived';

export interface TourDocument extends Document {
  // === Basic Info ===
  title: string;
  description?: string;
  price: number;
  duration: string;
  maxGroupSize?: number;

  // === Location ===
  location: string;                    // "Đà Nẵng, Việt Nam"
  destination: Types.ObjectId;         // Primary destination ref
  destinations: TourDestinationItem[]; // Multi destinations

  // === Enriched Fields (from AI) ===
  route: string;                       // "Đà Nẵng → Cầu Vàng → Đà Nẵng"
  highlights: string[];                // ["Check-in Cầu Vàng", "Cáp treo 5.8km"]
  schedule: TourSchedule;              // { morning, afternoon, evening }
  category: TourCategory;              // tham_quan | am_thuc | van_hoa | ...
  tips: string;                        // "Mang theo áo khoác..."

  // === Includes/Excludes ===
  inclusions: string[];                // ["Xe đưa đón", "Vé cáp treo"]
  exclusions: string[];                // ["Bữa tối", "Chi phí cá nhân"]

  // === Images ===
  mainImage?: string;
  imageGallery: string[];              // Legacy compatibility
  images: TourImage[];                 // New enriched images with captions

  // === Source & Deduplication ===
  source: TourSource;                  // web_scrape | user_created | partner
  sourceUrl?: string;                  // Unique key for deduplication

  // === Ratings ===
  averageRating?: number;
  reviewCount?: number;
  matchScore?: number;                 // AI match score (0-1)

  // === Itinerary (legacy) ===
  itinerary: TourItineraryItem[];

  // === Metadata ===
  owner?: Types.ObjectId;
  status: TourStatus;
  isSustainable: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// ============== Schema ==============

const TourImageSchema = new Schema<TourImage>({
  url: { type: String, required: true },
  thumbnail: { type: String },
  caption: { type: String }
}, { _id: false });

const TourScheduleSchema = new Schema<TourSchedule>({
  morning: { type: String },
  afternoon: { type: String },
  evening: { type: String }
}, { _id: false });

const TourSchema = new Schema<TourDocument>(
  {
    // Basic Info
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    maxGroupSize: { type: Number },

    // Location
    location: { type: String, default: '' },
    destination: {
      type: Schema.Types.ObjectId,
      ref: 'Destination',
      index: true,
    },
    destinations: [{
      destinationId: { type: Schema.Types.ObjectId, ref: 'Destination' },
      orderIndex: { type: Number, default: 0 },
      note: { type: String },
      name: { type: String },
      destinationName: { type: String }
    }],

    // Enriched Fields
    route: { type: String, default: '' },
    highlights: [{ type: String }],
    schedule: { type: TourScheduleSchema, default: {} },
    category: {
      type: String,
      enum: ['tham_quan', 'am_thuc', 'van_hoa', 'trai_nghiem', 'phieu_luu'],
      default: 'tham_quan'
    },
    tips: { type: String, default: '' },

    // Includes/Excludes
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],

    // Images
    mainImage: { type: String },
    imageGallery: [{ type: String }],
    images: [TourImageSchema],

    // Source & Deduplication
    source: {
      type: String,
      enum: ['web_scrape', 'user_created', 'partner'],
      default: 'web_scrape'
    },
    sourceUrl: {
      type: String,
      sparse: true,
      index: true
    },

    // Ratings
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    matchScore: { type: Number },

    // Itinerary (legacy)
    itinerary: [{
      day: { type: Number, required: true },
      title: { type: String, required: true },
      description: { type: String, required: true }
    }],

    // Metadata
    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true
    },
    isSustainable: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// ============== Indexes ==============

// Text search on title and description
TourSchema.index({ title: 'text', description: 'text' });

// Compound index for search queries
TourSchema.index({ location: 1, category: 1, status: 1 });

// Unique index on sourceUrl for deduplication (sparse to allow null)
TourSchema.index({ sourceUrl: 1 }, { unique: true, sparse: true });

// ============== Export ==============

const Tour: Model<TourDocument> =
  mongoose.models.Tour || mongoose.model<TourDocument>('Tour', TourSchema);

export default Tour;
