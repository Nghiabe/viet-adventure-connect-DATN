// src/components/auth/ProtectedRoute.tsx
import { useAuth } from '@/context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

interface ProtectedRouteProps {
  allowedRoles?: ('user' | 'partner' | 'staff' | 'admin')[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  // Show loader while checking authentication status
  if (isLoading) {
    return <FullScreenLoader />;
  }

  // Not logged in, redirect to login
  if (!user) {
    console.log('[ProtectedRoute] User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is provided, check if the user's role is included
  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    console.log(`[ProtectedRoute] User ${user.email} (${user.role}) not authorized for this route`);
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has the correct role, render the child route
  console.log(`[ProtectedRoute] User ${user.email} (${user.role}) authorized, rendering route`);
  return <Outlet />;
};

export default ProtectedRoute;


