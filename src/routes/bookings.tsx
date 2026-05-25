import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/components/Layout';

export const Route = createFileRoute('/bookings')({
  component: () => (
    <>
      <PageHeader title="Bookings" subtitle="Payouts, refunds, disputes" />
      <div className="p-8 card">
        <p className="font-quote italic text-ink-2 text-lg">
          Bookings operations console — list, refund, payout reports, disputes.
        </p>
      </div>
    </>
  ),
});
