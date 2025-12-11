// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { IUser } from '@/types/models';
import apiClient from '@/services/apiClient';

// Auth context interface
interface AuthContextType {
  user: IUser | null;
  role: IUser['role'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refetchUser: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const checkSession = useCallback(async () => {
    try {
      console.log('[AuthContext] Checking existing session...');
      const response = await apiClient.get<IUser>('/auth/me');
      if (response.success && response.data) {
        console.log('[AuthContext] Session restored for user:', response.data.email);
        setUser(response.data);
      } else {
        console.log('[AuthContext] No valid session found');
        setUser(null);
      }
    } catch (error: any) {
      console.log('[AuthContext] Session check failed:', error.message);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Session persistence logic - runs once when app loads
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[AuthContext] Attempting login for:', email);
      const response = await apiClient.post<IUser>('/auth/login', { email, password });
      
      // --- THE FIX ---
      // Guard clause: check for success and data existence
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed');
      }
      
      // Only set user and navigate on success
      console.log('[AuthContext] Login successful for:', response.data.email);
      setUser(response.data);
      
      // Redirect based on role after successful login
      if (response.data.role === 'admin' || response.data.role === 'staff') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function with type-safe handling
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[AuthContext] Attempting registration for:', userData.email);
      const response = await apiClient.post<IUser>('/auth/register', userData);
      
      // --- THE FIX ---
      // Guard clause: check for success and data existence
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Registration failed');
      }
      
      // Only set user and navigate on success
      console.log('[AuthContext] Registration successful for:', response.data.email);
      setUser(response.data);
      navigate('/');
    } catch (error: any) {
      console.error('[AuthContext] Registration error:', error);
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced logout function with navigation and user feedback
  const logout = async () => {
    try {
      console.log('[AuthContext] Logging out user:', user?.email);
      
      // 1. Call the backend API to clear the secure cookie
      await apiClient.post('/auth/logout', {});
      
      // 2. Clear the user state in the context
      setUser(null);
      
      // 3. Redirect the user to the homepage
      navigate('/');
      
      // 4. Provide clear user feedback
      toast.success('Đăng xuất thành công.');
      
      console.log('[AuthContext] Logout successful');
    } catch (error: any) {
      console.error('[AuthContext] Logout error:', error);
      
      // Failsafe: Even if the API call fails (e.g., network error),
      // ensure the user is logged out on the client-side for a consistent UX
      setUser(null);
      navigate('/');
      
      // Still show success message - user intent was to log out
      toast.success('Đăng xuất thành công.');
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Computed values
  const isAuthenticated = !!user;
  const role = user?.role || null;

  const value: AuthContextType = {
    user,
    role,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    refetchUser: checkSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


