import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from 'react';
import { AuthProvider } from "@/context/AuthContext";
import { BookingProvider } from "@/context/BookingContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

const DashboardPage = lazy(() => import('./pages/dashboard'));
import AIFloatingWidget from "@/components/ai-assistant/AIFloatingWidget";
import Index from "./pages/Index";
import ItineraryResults from "./pages/ItineraryResults";
import ItineraryDetailPage from "./pages/itinerary/ItineraryDetailPage";
import UserProfile from "./pages/UserProfile";
import SettingsPage from "./pages/profile/SettingsPage";
import ToursSearch from "./pages/ToursSearch";
import HotelSearchResultsPage from "./pages/search/HotelSearchResultsPage";
import HotelDetailPage from '@/pages/HotelDetailPage';
import FlightsResultsPage from "./pages/search/FlightsResultsPage";
import ExperienceDetail from "./pages/ExperienceDetail";
import CheckoutPage from "./pages/CheckoutPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import TransportationHub from "./pages/TransportationHub";
import CommunityHub from "./pages/CommunityHub";
import MobileAppLanding from "./pages/MobileAppLanding";
import DestinationDetail from "./pages/DestinationDetail";
import NotFound from "./pages/NotFound";
import MyPlansPage from "./pages/MyPlansPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <BookingProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/pending-approval" element={<PendingApprovalPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected Routes - User & Partner */}
              <Route element={<ProtectedRoute allowedRoles={['user', 'partner']} />}>
                <Route path="/" element={<Index />} />
                <Route path="/itinerary" element={<ItineraryResults />} />
                <Route path="/itinerary/:id" element={<ItineraryResults />} />
                <Route path="/itinerary-detail" element={<ItineraryDetailPage />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/profile/settings" element={<SettingsPage />} />
                <Route path="/profile/bookings/:id" element={<BookingDetailPage />} />
                <Route path="/tours" element={<ToursSearch />} />
                <Route path="/tours/search" element={<ToursSearch />} />
                <Route path="/hotels/search" element={<HotelSearchResultsPage />} />
                <Route path="/hotels/:id" element={<HotelDetailPage />} />
                <Route path="/flights/search" element={<FlightsResultsPage />} />
                <Route path="/experience/:id" element={<ExperienceDetail />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/booking/success/:id" element={<BookingSuccessPage />} />
                <Route path="/transportation" element={<TransportationHub />} />
                <Route path="/community" element={<CommunityHub />} />
                <Route path="/mobile-app" element={<MobileAppLanding />} />
                <Route path="/destinations/:slug" element={<DestinationDetail />} />
                <Route path="/my-plans" element={<MyPlansPage />} />
              </Route>

              {/* Unified Dashboard Route with role-based access */}
              <Route
                path="/dashboard/*"
                element={
                  <Suspense fallback={<FullScreenLoader />}>
                    <ProtectedRoute allowedRoles={["admin", "staff", "partner"]} />
                  </Suspense>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="*" element={<DashboardPage />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIFloatingWidget />
          </BookingProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
