// src/types/models.ts
// This is the definitive data contract for the entire frontend.

export interface IDestination {
  _id: string;
  name: string;
  slug: string;
  description: string;
  history?: string;
  culture?: string;
  geography?: string;
  mainImage: string;
  imageGallery?: string[];
  bestTimeToVisit?: string;
  essentialTips?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ITour {
  _id: string;
  title: string;
  destination: IDestination | string; // Can be populated or just an ID
  owner: IUser | string;
  price: number;
  duration: string;
  maxGroupSize: number;
  description: string;
  itinerary?: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  inclusions?: string[];
  exclusions?: string[];
  isSustainable?: boolean;
  averageRating?: number;
  reviewCount?: number;
  mainImage: string; // This field is now mandatory.
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'partner' | 'staff' | 'admin';
  status: 'active' | 'pending_approval' | 'suspended';
  savedTours: string[];
  savedStories: string[];
  contributionScore?: number;
  preferences: {
    marketingEmails: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IReview {
  _id: string;
  user: IUser | string;
  tour: ITour | string;
  rating: number;
  comment: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IStory {
  _id: string;
  title: string;
  content: string;
  author: IUser | string;
  destination: IDestination | string;
  images?: string[];
  tags: string[];
  likes: number;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBooking {
  _id: string;
  user: IUser | string;
  tour: ITour | string;
  participants: number;
  participantsBreakdown?: { adults?: number; children?: number };
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  bookingDate: string;
  paymentMethod?: string;
  paymentTransactionId?: string;
  priceBreakdown?: { basePrice?: number; taxes?: number; fees?: number };
  history?: Array<{ at: string; action: string; by?: IUser | string; note?: string }>;
  tourDate: string;
  createdAt: string;
  updatedAt: string;
}


