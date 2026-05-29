'use client';

import { PageHeader } from '@/components/PageHeader';

export default function BookingsPage() {
  return (
    <>
      <PageHeader title="Bookings" subtitle="Payouts, refunds, disputes" />
      <div className="p-8 card">
        <p className="font-quote italic text-ink-2 text-lg">
          Bookings operations console — list, refund, payout reports, disputes.
        </p>
      </div>
    </>
  );
}
