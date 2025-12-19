
import type { ServerResponse } from 'http';
import dbConnect from '@/lib/dbConnect';
import Coupon from '@/models/Coupon';
import { withRole, AuthedRequest } from '@/lib/auth/withAuth';

function send(res: ServerResponse, status: number, body: unknown) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}

async function handler(req: AuthedRequest, res: ServerResponse) {
    await dbConnect();
    const userId = req.user!.userId;

    if (req.method === 'GET') {
        try {
            // Find coupons where this partner is listed in applicableToPartners
            // This implies the coupon belongs to them or is specific to them
            const coupons = await Coupon.find({
                'rules.applicableToPartners': userId
            }).sort({ createdAt: -1 }).lean();

            return send(res, 200, { success: true, data: coupons });
        } catch (error) {
            console.error('[Partner Coupons GET] Error:', error);
            return send(res, 500, { success: false, error: 'Internal Server Error' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { code, discountType, discountValue, limit, expiry } = req.body;

            // Basic validation
            if (!code || !discountType || !discountValue) {
                return send(res, 400, { success: false, error: 'Missing required fields' });
            }

            const couponData = {
                code: code.toUpperCase(), // Normalize code
                discountType,
                discountValue,
                description: `Partner Coupon for ${req.user?.username || 'Partner'}`,
                rules: {
                    applicableToPartners: [userId], // Crucial: Link to this partner
                    // We could also link to specific tours if provided in body
                },
                limits: {
                    totalUses: limit || 0
                },
                endDate: expiry ? new Date(expiry) : undefined,
                isActive: true,
                usedCount: 0
            };

            const existing = await Coupon.findOne({ code: couponData.code });
            if (existing) {
                return send(res, 400, { success: false, error: 'Mã giảm giá này đã tồn tại' });
            }

            const coupon = await Coupon.create(couponData);
            return send(res, 201, { success: true, data: coupon });
        } catch (error) {
            console.error('[Partner Coupons POST] Error:', error);
            return send(res, 500, { success: false, error: 'Internal Server Error' });
        }
    }

    return send(res, 405, { success: false, error: 'Method Not Allowed' });
}

export default withRole(['partner'], handler);
