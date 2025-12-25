import { createContext, useContext, useState, ReactNode } from 'react';

export interface PreBookingDetails {
  type?: 'tour' | 'hotel' | 'flight' | 'train' | 'bus';
  tourId?: string;
  hotelId?: string;
  title: string; // Generic title (Tour name, Hotel name, or Transport route)
  tourName?: string; // Legacy support
  duration?: string;
  bookingDate?: string; // ISO string 
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  bedType?: string;
  participantsTotal: number;
  participantsBreakdown?: { adults?: number; children?: number };
  unitPrice: number;
  clientComputedTotal: number;
  image?: string;
  address?: string;
  providerUrl?: string;
  raw?: any;
  // Transport Specific (Flight, Train, Bus)
  airline?: string; // specific for flight
  operator?: string; // generic for train/bus
  flightNumber?: string;
  transportNumber?: string; // generic for train/bus
  origin?: { code?: string; city?: string; station?: string; time: string };
  destination?: { code?: string; city?: string; station?: string; time: string };
  class?: string;
  stops?: number;
}

interface BookingContextValue {
  bookingDetails: PreBookingDetails | null;
  initiateBooking: (details: PreBookingDetails) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingDetails, setBookingDetails] = useState<PreBookingDetails | null>(null);

  function initiateBooking(details: PreBookingDetails) {
    setBookingDetails(details);
  }

  function clearBooking() {
    setBookingDetails(null);
  }

  return (
    <BookingContext.Provider value={{ bookingDetails, initiateBooking, clearBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within a BookingProvider');
  return ctx;
}




