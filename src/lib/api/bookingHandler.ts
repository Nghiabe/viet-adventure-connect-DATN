import type { IncomingMessage, ServerResponse } from 'http';
import { parse as parseCookie } from 'cookie';
import dbConnect from '../dbConnect';
import Booking from '../../models/Booking';
import Tour from '../../models/Tour';
import { verifyJwt } from '../auth/jwt';

// Helper to parse JSON request body safely
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => (body += chunk.toString()));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', (err: any) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export async function handleCreateBooking(req: IncomingMessage, res: ServerResponse) {
  try {
    await dbConnect();

    // Authenticate user from cookie
    const cookies = parseCookie(req.headers.cookie || '');
    const token = cookies['auth_token'];
    const payload = token ? verifyJwt(token) : null;
    if (!payload) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    // Parse and validate body
    const body = await parseBody(req);
    const tourId: string | undefined = body?.tourId;
    const bookingDateRaw: string | undefined = body?.bookingDate;
    const participantsTotal: number | undefined = body?.participants;
    const participantsBreakdown: { adults?: number; children?: number } | undefined = body?.participantsBreakdown;
    const customerInfo: any = body?.customerInfo;
    const paymentMethod: string | undefined = body?.paymentMethod;

    if (!tourId || !bookingDateRaw || !participantsTotal || !customerInfo) {
      return sendJson(res, 400, { success: false, error: 'Missing required fields.' });
    }

    // Coerce and validate numbers
    const adults = Math.max(0, Number(participantsBreakdown?.adults || participantsTotal));
    const children = Math.max(0, Number(participantsBreakdown?.children || 0));
    const computedTotalParticipants = adults + children;
    if (computedTotalParticipants !== Number(participantsTotal)) {
      return sendJson(res, 400, { success: false, error: 'Participants mismatch.' });
    }

    const bookingDate = new Date(bookingDateRaw);
    if (isNaN(bookingDate.getTime())) {
      return sendJson(res, 400, { success: false, error: 'Invalid bookingDate.' });
    }

    // Load tour and verify
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return sendJson(res, 404, { success: false, error: 'Tour not found.' });
    }

    // Server-side price calculation (never trust client)
    const pricePerAdult = Number(tour.price || 0);
    const pricePerChild = pricePerAdult * 0.7; // business rule
    const basePrice = adults * pricePerAdult + children * pricePerChild;
    const taxes = Math.round(basePrice * 0.0); // no tax for now; keep for future
    const fees = 0; // placeholder for service fees
    const totalPrice = basePrice + taxes + fees;

    // Create booking document atomically
    const newBooking = await Booking.create({
      user: (await import('mongoose')).default.Types.ObjectId.createFromHexString(payload.userId),
      tour: tour._id,
      tourInfo: {
        title: tour.title,
        price: tour.price,
        duration: tour.duration,
      },
      bookingDate,
      participants: computedTotalParticipants,
      participantsBreakdown: { adults, children },
      totalPrice,
      priceBreakdown: { basePrice, taxes, fees },
      paymentMethod,
      status: 'pending',
      history: [
        { at: new Date(), action: 'Booking created (pending)' },
      ],
    });

    return sendJson(res, 201, { success: true, data: newBooking });
  } catch (error: any) {
    console.error('[API] POST /api/bookings error:', error);
    return sendJson(res, 500, { success: false, error: error?.message || 'Server Error' });
  }
}


