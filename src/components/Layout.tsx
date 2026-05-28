import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { clsx } from 'clsx';
import {
  SquaresFour,
  MapPin,
  Tent,
  Bed,
  CreditCard,
  Warning,
  Image as ImageIcon,
  ChartLine,
  Gear,
  type Icon as PhIcon,
} from '@phosphor-icons/react';
import { auth } from '@/lib/auth';

const NAV: { to: string; label: string; Icon: PhIcon }[] = [
  { to: '/',             label: 'Overview',     Icon: SquaresFour },
  { to: '/destinations', label: 'Destinations', Icon: MapPin },
  { to: '/treks',        label: 'Treks',        Icon: Tent },
  { to: '/providers',    label: 'Providers',    Icon: Bed },
  { to: '/bookings',     label: 'Bookings',     Icon: CreditCard },
  { to: '/advisories',   label: 'Advisories',   Icon: Warning },
  { to: '/media',        label: 'Media',        Icon: ImageIcon },
  { to: '/analytics',    label: 'Analytics',    Icon: ChartLine },
  { to: '/settings',     label: 'Settings',     Icon: Gear },
];

export function Layout() {
  const { location } = useRouterState();
  const path = location.pathname;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-line bg-white">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-kong text-white font-serif text-base">
            K
          </div>
          <div>
            <div className="font-serif text-base font-bold leading-none">Kashmir</div>
            <div className="font-serif italic text-sm leading-none text-kong-deep mt-0.5">Explorer</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map((n) => {
            const active = n.to === '/' ? path === '/' : path.startsWith(n.to);
            const Ico = n.Icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={clsx(
                  'flex items-center gap-3 px-5 py-2 text-sm transition',
                  active
                    ? 'border-l-2 border-kong bg-pashmina/50 text-ink font-medium'
                    : 'text-ink-2 hover:bg-pashmina/30 hover:text-ink border-l-2 border-transparent',
                )}
              >
                <Ico size={18} weight={active ? 'duotone' : 'regular'} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-line flex items-center justify-between">
          <span className="text-[10px] font-mono text-ink-3 tracking-wider">ADMIN v0.1.0</span>
          <button onClick={auth.signOut} className="text-[11px] text-chinar font-medium">Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({
  title, subtitle, action,
}: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-pashmina/80 backdrop-blur px-8 py-5">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
