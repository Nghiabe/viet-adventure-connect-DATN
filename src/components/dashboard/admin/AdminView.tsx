import AdminLayout from '@/components/layout/AdminLayout';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModerationPage } from '@/pages/dashboard/_stubs';
import SettingsPage from '@/pages/admin/SettingsPage';
import DestinationsPage from '@/pages/admin/DestinationsPage';
import DestinationEditorPage from '@/pages/admin/DestinationEditorPage';
import AnalyticsPage from '@/pages/admin/AnalyticsPage';
import MarketingPage from '@/pages/admin/MarketingPage';
import BookingsPage from '@/pages/admin/BookingsPage';
import BookingDetailPage from '@/pages/admin/BookingDetailPage';
import ToursPage from '@/pages/admin/ToursPage';
import ServicesPage from '@/pages/admin/ServicesPage';
import TourEditorPage from '@/pages/admin/TourEditorPage';
import UserManagement from '@/components/dashboard/admin/UserManagement';
import AdminDashboard from '@/components/dashboard/admin/AdminDashboard';

export default function AdminView() {
  return (
    <div className="dark">
      <AdminLayout>
        <Routes>
          <Route index element={<div className="p-6"><AdminDashboard /></div>} />
          <Route path="users" element={<UserManagement />} />
          <Route path="tours" element={<ToursPage />} />
          <Route path="services" element={<ServicesPage />} />
          {/* <Route path="tours/edit/:id" element={<TourEditorPage />} /> Admin cannot edit tours */}
          <Route path="moderation" element={<ModerationPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<div className="p-6"><BookingDetailPage /></div>} />
          <Route path="destinations" element={<DestinationsPage />} />
          <Route path="destinations/edit/:slugOrId" element={<div className="p-0"><DestinationEditorPage /></div>} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AdminLayout>
    </div>
  );
}


