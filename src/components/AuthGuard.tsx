import React, { useEffect } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { auth } from '@/lib/auth';

/**
 * AuthGuard — wrap any route that needs login. Pushes to /login if no token.
 * Use in the root layout so admin routes never flash before redirect.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    if (location.pathname === '/login') return;
    if (!auth.isAuthenticated()) navigate({ to: '/login' });
  }, [location.pathname, navigate]);

  if (location.pathname !== '/login' && !auth.isAuthenticated()) {
    return null; // brief flash avoided
  }
  return <>{children}</>;
}
