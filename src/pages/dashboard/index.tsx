import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminView from '@/components/dashboard/admin/AdminView';
import PartnerView from '@/components/dashboard/partner/PartnerView';

export default function DashboardRouter() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;

  // The intelligent switch based on the user's role
  if (user.role === 'admin' || user.role === 'staff') {
    return <AdminView />;
  }

  if (user.role === 'partner') {
    return <PartnerView />;
  }

  // Fallback for any other case (e.g., a regular 'user' trying to access the route)
  return <Navigate to="/" replace />;
}


