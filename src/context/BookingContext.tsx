import { createContext, useContext, useState, ReactNode } from 'react';

export interface PreBookingDetails {
  tourId: string;
  tourName: string;
  duration?: string;
  bookingDate: string; // ISO string
  participantsTotal: number;
  participantsBreakdown?: { adults?: number; children?: number };
  unitPrice: number;
  clientComputedTotal: number; // informational; server will recompute
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




