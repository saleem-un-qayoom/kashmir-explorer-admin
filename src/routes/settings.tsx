import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/components/Layout';

export const Route = createFileRoute('/settings')({
  component: () => (
    <>
      <PageHeader title="Settings" subtitle="App-wide configuration" />
      <div className="p-8 space-y-4 max-w-2xl">
        <div className="card p-6">
          <h2 className="font-serif text-lg font-bold mb-2">Seasonal banner</h2>
          <p className="text-sm text-ink-2 mb-4">Override the auto-detected season for the mobile app's home banner.</p>
          <select className="rounded-btn border border-line bg-white px-3 py-2 text-sm">
            <option>Auto (Chinar Autumn · live)</option>
            <option>Tulip Spring</option>
            <option>Trek Summer</option>
            <option>Snow Winter</option>
          </select>
        </div>
        <div className="card p-6">
          <h2 className="font-serif text-lg font-bold mb-2">Featured destination IDs</h2>
          <input className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm" placeholder="gulmarg, dal-lake, tulip-garden" />
        </div>
        <div className="card p-6">
          <h2 className="font-serif text-lg font-bold mb-2">Maintenance mode</h2>
          <label className="flex items-center gap-3">
            <input type="checkbox" />
            <span className="text-sm">Show maintenance screen to all mobile clients</span>
          </label>
        </div>
      </div>
    </>
  ),
});
