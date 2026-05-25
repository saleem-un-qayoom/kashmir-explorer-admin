import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { AuthGuard } from '@/components/AuthGuard';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    const { location } = useRouterState();
    // /login skips the Layout chrome.
    if (location.pathname === '/login') return <Outlet />;
    return (
      <AuthGuard>
        <Layout />
        <TanStackRouterDevtools />
      </AuthGuard>
    );
  },
});
