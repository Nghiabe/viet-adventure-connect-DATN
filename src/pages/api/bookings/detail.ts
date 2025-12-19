import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';
import Booking from '@/models/Booking';
import Tour from '@/models/Tour';
import mongoose from 'mongoose';

function send(res: ServerResponse, status: number, body: unknown) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}

export default withRole(['user', 'partner', 'admin', 'staff'], async function handler(req: AuthedRequest, res: ServerResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
    }

    try {
        await dbConnect();

        // Extract ID from query string manually since we are in a raw node handler context often in this project structure
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const id = url.searchParams.get('id');

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return send(res, 400, { success: false, error: 'Booking ID is missing or invalid' });
        }

        console.log(`[BookingDetail] Fetching booking ${id}...`);

        const booking = await Booking.findById(id)
            .populate({
                path: 'tour',
                model: Tour,
                select: 'title mainImage images destination duration itinerary route highlights location'
            })
            .populate({
                path: 'tour.destination', // Populate nested destination in tour if needed, though 'destination' in tour might be just ObjectId
                select: 'name'
            })
            .lean();

        if (!booking) {
            console.log(`[BookingDetail] Booking not found: ${id}`);
            return send(res, 404, { success: false, error: 'Booking not found' });
        }

        // Check if tour details exist (in case tour was deleted)
        if (!booking.tour) {
            console.error(`[BookingDetail] Tour not found for booking: ${id}`);
            return send(res, 404, { success: false, error: 'Tour information not found (possibly deleted)' });
        }

        // Security check: Ensure the user owns the booking or is admin/staff
        const user = req.user as any;
        const isOwner = booking.user.toString() === user._id.toString();
        const isAdminOrStaff = ['admin', 'staff'].includes(user.role);

        if (!isOwner && !isAdminOrStaff) {
            console.warn(`[BookingDetail] Unauthorized access attempt by user ${user._id} for booking ${id}`);
            return send(res, 403, { success: false, error: 'You do not have permission to view this booking' });
        }

        console.log(`[BookingDetail] Successfully retrieved booking ${id}`);
        return send(res, 200, { success: true, data: booking });
    } catch (error: any) {
        console.error('[BookingDetail] Error:', error);
        return send(res, 500, { success: false, error: error?.message || 'Internal Server Error' });
    }
});
