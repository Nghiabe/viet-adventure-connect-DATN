import AdminLayout from '@/components/layout/AdminLayout';
import { Routes, Route, Navigate } from 'react-router-dom';
import PartnerDashboard from '@/components/dashboard/partner/PartnerDashboard';
import PartnerToursPage from '@/pages/dashboard/partner/PartnerToursPage';
import PartnerBookingsPage from '@/pages/dashboard/partner/PartnerBookingsPage';
import PartnerReviewsPage from '@/pages/dashboard/partner/PartnerReviewsPage';

export default function PartnerView() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<div className="p-6"><PartnerDashboard /></div>} />
        <Route path="tours" element={<div className="p-6"><PartnerToursPage /></div>} />
        <Route path="bookings" element={<div className="p-6"><PartnerBookingsPage /></div>} />
        <Route path="reviews" element={<div className="p-6"><PartnerReviewsPage /></div>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}


