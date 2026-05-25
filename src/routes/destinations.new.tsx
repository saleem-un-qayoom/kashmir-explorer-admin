/**
 * Redirect /destinations/new → /destinations/new (using the $id route with id="new")
 */
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/destinations/new')({
  beforeLoad: () => {
    throw redirect({ to: '/destinations/$id', params: { id: 'new' } });
  },
  component: () => null,
});
