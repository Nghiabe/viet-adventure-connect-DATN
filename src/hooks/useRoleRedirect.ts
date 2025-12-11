// src/hooks/useRoleRedirect.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const roleRedirectMap = {
  user: '/',
  partner: '/dashboard',
  staff: '/dashboard',
  admin: '/dashboard'
} as const;

export const useRoleRedirect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const path = roleRedirectMap[user.role as keyof typeof roleRedirectMap];
      if (path) {
        console.log(`[useRoleRedirect] Redirecting ${user.role} user to: ${path}`);
        navigate(path, { replace: true });
      }
    }
  }, [user, navigate]);
};


