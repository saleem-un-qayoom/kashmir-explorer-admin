'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pathname === '/login') return;
    if (!auth.isAuthenticated()) router.push('/login');
  }, [pathname, router, mounted]);

  if (!mounted) return null;
  if (pathname !== '/login' && !auth.isAuthenticated()) {
    return null;
  }
  return <>{children}</>;
}
