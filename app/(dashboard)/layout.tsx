import { DashboardShell } from '@/components/Layout';
import { AuthGuard } from '@/components/AuthGuard';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
