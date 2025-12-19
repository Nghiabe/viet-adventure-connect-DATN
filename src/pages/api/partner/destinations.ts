import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Destination from '@/models/Destination';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';

function send(res: ServerResponse, status: number, body: unknown) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}

async function handler(req: AuthedRequest, res: ServerResponse) {
    await dbConnect();

    if (req.method !== 'GET') {
        return send(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const { limit = '500' } = req.query || {};
        const limitNum = parseInt(limit as string) || 500;

        const destinations = await Destination.find({ status: 'published' })
            .select('_id name slug')
            .sort({ name: 1 })
            .limit(limitNum)
            .lean();

        return send(res, 200, { success: true, data: destinations });
    } catch (error) {
        console.error('[Partner Destinations List] Error:', error);
        return send(res, 500, { success: false, error: 'Internal Server Error' });
    }
}

export default withRole(['partner'], handler);
