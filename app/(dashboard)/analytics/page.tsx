'use client';

import { PageHeader } from '@/components/PageHeader';

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Views, saves, bookings, search queries" />
      <div className="p-8 grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="font-mono text-[10px] tracking-wider text-ink-3">VIEWS · 30 DAYS</div>
          <div className="font-serif text-4xl font-bold mt-2">—</div>
        </div>
        <div className="card p-5">
          <div className="font-mono text-[10px] tracking-wider text-ink-3">BOOKINGS · 30 DAYS</div>
          <div className="font-serif text-4xl font-bold mt-2">—</div>
        </div>
        <div className="card p-5">
          <div className="font-mono text-[10px] tracking-wider text-ink-3">REVENUE · 30 DAYS</div>
          <div className="font-serif text-4xl font-bold mt-2 text-kong">₹—</div>
        </div>
        <div className="card p-6 col-span-3">
          <h2 className="font-serif text-lg font-bold mb-3">Top destinations by views</h2>
          <p className="font-quote italic text-ink-2">PostHog integration wires the chart here.</p>
        </div>
      </div>
    </>
  );
}
