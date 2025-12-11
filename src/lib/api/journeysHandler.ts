import { IncomingMessage, ServerResponse } from 'http';

export async function handleGetUserJourneys(req: IncomingMessage, res: ServerResponse) {
  try {
    // Dynamic imports to avoid path resolution issues when imported by vite.config.ts
    const dbConnect = (await import('../dbConnect')).default;
    const Booking = (await import('../../models/Booking')).default;
    const { formatDate } = await import('../../utils/format');
    
    await dbConnect();
    
    // 1. Authenticate user from cookies
    const { parse } = await import('cookie');
    const { verifyJwt } = await import('../auth/jwt');
    
    const cookies = parse(req.headers.cookie || '');
    const token = cookies['auth_token'];
    
    if (!token) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Authentication required.' }));
    }
    
    const payload = verifyJwt(token);
    if (!payload) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Invalid or expired token.' }));
    }
    
    const { userId } = payload;

    // 2. Fetch user's completed bookings with tour information in a single optimized query
    const userBookings = await Booking.find({ 
      user: userId, 
      status: 'confirmed' // Using 'confirmed' as completed status since the model doesn't have 'completed'
    })
    .sort({ bookingDate: -1 }) // Show the most recent journeys first
    .populate({
      path: 'tour',
      select: 'title duration' // Only select the fields we absolutely need
    })
    .lean(); // Use lean() for better performance since we don't need Mongoose documents

    // 3. Transform the data into the clean format the frontend needs
    const journeys = userBookings.map(booking => ({
      id: booking._id.toString(),
      title: booking.tour?.title || booking.tourInfo?.title || 'Tour không xác định',
      dateRange: formatDate(booking.bookingDate, "dd/MM/yyyy"),
      status: 'Đã hoàn thành',
      participants: booking.participants,
      totalPrice: booking.totalPrice
    }));

    // 4. Send successful response
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      success: true, 
      data: journeys 
    }));

  } catch (error: unknown) {
    console.error('[API Handler Error] GET /api/users/journeys:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      success: false, 
      error: `Server Error: ${errorMessage}` 
    }));
  }
}
