import AdminLayout from '@/components/layout/AdminLayout';
import { Routes, Route, Navigate } from 'react-router-dom';
import PartnerDashboard from '@/components/dashboard/partner/PartnerDashboard';
import PartnerToursPage from '@/pages/dashboard/partner/PartnerToursPage';
import PartnerBookingsPage from '@/pages/dashboard/partner/PartnerBookingsPage';
import PartnerReviewsPage from '@/pages/dashboard/partner/PartnerReviewsPage';
import PartnerProfilePage from '@/pages/dashboard/partner/PartnerProfilePage';
import PartnerSettingsPage from '@/pages/dashboard/partner/PartnerSettingsPage';
import PartnerTourEditorPage from '@/pages/dashboard/partner/PartnerTourEditorPage';
import PartnerServicesPage from '@/pages/dashboard/partner/PartnerServicesPage';
import PartnerMarketingPage from '@/pages/dashboard/partner/PartnerMarketingPage';
import PartnerAnalyticsPage from '@/pages/dashboard/partner/PartnerAnalyticsPage';

export default function PartnerView() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<div className="p-6"><PartnerDashboard /></div>} />
        <Route path="tours" element={<div className="p-6"><PartnerToursPage /></div>} />
        <Route path="tours/edit/:id" element={<div className="p-6"><PartnerTourEditorPage /></div>} />
        <Route path="services" element={<div className="p-6"><PartnerServicesPage /></div>} />
        <Route path="bookings" element={<div className="p-6"><PartnerBookingsPage /></div>} />
        <Route path="marketing" element={<div className="p-6"><PartnerMarketingPage /></div>} />
        <Route path="analytics" element={<div className="p-6"><PartnerAnalyticsPage /></div>} />
        <Route path="reviews" element={<div className="p-6"><PartnerReviewsPage /></div>} />
        <Route path="profile" element={<div className="p-6"><PartnerProfilePage /></div>} />
        <Route path="settings" element={<div className="p-6"><PartnerSettingsPage /></div>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}


