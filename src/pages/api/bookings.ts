import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';
import Booking from '@/models/Booking';
import Tour from '@/models/Tour';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default withRole(['user','partner'], async function handler(req: AuthedRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    await dbConnect();

    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const bodyString = Buffer.concat(chunks).toString('utf8');
    const body = bodyString ? JSON.parse(bodyString) : {};

    const { tourId, bookingDate, participants, participantsBreakdown, customerInfo, paymentMethod } = body || {};

    if (!tourId || !bookingDate || !participants || !customerInfo?.name || !customerInfo?.email || !customerInfo?.phone) {
      return send(res, 400, { success: false, error: 'Thiếu thông tin bắt buộc' });
    }

    const tour = await Tour.findById(tourId).lean();
    if (!tour || tour.status !== 'published') {
      return send(res, 404, { success: false, error: 'Tour không tồn tại hoặc không khả dụng' });
    }

    const date = new Date(bookingDate);
    if (Number.isNaN(date.getTime()) || date < new Date()) {
      return send(res, 400, { success: false, error: 'Ngày khởi hành không hợp lệ' });
    }

    const adults = Math.max(0, Number(participantsBreakdown?.adults ?? participants));
    const children = Math.max(0, Number(participantsBreakdown?.children ?? 0));
    const totalParticipants = Math.max(1, Number(participants));

    // Server-side pricing: children at 70% of adult price
    const unitPrice = Number(tour.price || 0);
    const adultsTotal = unitPrice * adults;
    const childrenTotal = unitPrice * 0.7 * children;
    const totalPrice = Math.round(adultsTotal + childrenTotal);

    const doc = await Booking.create({
      user: (req.user as any)?.id,
      tour: tour._id,
      tourInfo: { title: tour.title, price: unitPrice, duration: tour.duration },
      bookingDate: date,
      participants: totalParticipants,
      participantsBreakdown: { adults, children },
      totalPrice,
      status: 'pending',
      paymentMethod,
      history: [{ action: 'created', by: (req.user as any)?.id, note: `Payment method: ${paymentMethod || 'N/A'}` }]
    });

    return send(res, 201, { success: true, data: doc });
  } catch (error: any) {
    console.error('Create booking error:', error);
    return send(res, 500, { success: false, error: error?.message || 'Internal Server Error' });
  }
});



