'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  SquaresFour,
  MapPin,
  Tent,
  Bed,
  Warning,
  Path,
  PersonSimpleHike,
  Tag,
  GlobeHemisphereWest,
  Sparkle,
  IdentificationCard,
  Camera,
  TrafficSign,
  CalendarCheck,
  MapTrifold,
  ChartLineUp,
  Images,
  ImageSquare,
  Palette,
  Gear,
  SignOut,
  Star,
  type Icon as PhIcon,
} from '@phosphor-icons/react';
import { auth } from '@/lib/auth';

type NavItem = { to: string; label: string; Icon: PhIcon };
type NavGroup = { heading: string | null; items: NavItem[] };

// Navigation organised by the kind of data it surfaces, not alphabetically.
const NAV: NavGroup[] = [
  {
    heading: null,
    items: [{ to: '/', label: 'Overview', Icon: SquaresFour }],
  },
  {
    heading: 'Places & content',
    items: [
      { to: '/home-hero', label: 'Home hero', Icon: ImageSquare },
      { to: '/destinations', label: 'Destinations', Icon: MapPin },
      { to: '/cultural', label: 'Cultural', Icon: Sparkle },
      { to: '/photo-spots', label: 'Photo spots', Icon: Camera },
    ],
  },
  {
    heading: 'Trails & trips',
    items: [
      { to: '/treks', label: 'Treks', Icon: Tent },
      { to: '/map', label: '3D map', Icon: GlobeHemisphereWest },
      { to: '/trail-reports', label: 'Trail reports', Icon: Path },
      { to: '/reviews', label: 'Reviews', Icon: Star },
      { to: '/tracks', label: 'Recordings', Icon: PersonSimpleHike },
    ],
  },
  {
    heading: 'Partners',
    items: [
      { to: '/providers', label: 'Providers', Icon: Bed },
      { to: '/bookings', label: 'Bookings', Icon: CalendarCheck },
    ],
  },
  {
    heading: 'Live status',
    items: [
      { to: '/advisories', label: 'Advisories', Icon: Warning },
      { to: '/road-status', label: 'Road status', Icon: TrafficSign },
    ],
  },
  {
    heading: 'Taxonomy',
    items: [
      { to: '/categories', label: 'Categories', Icon: Tag },
      { to: '/regions', label: 'Regions', Icon: MapTrifold },
      { to: '/permits', label: 'Permits', Icon: IdentificationCard },
    ],
  },
  {
    heading: 'Insights',
    items: [
      { to: '/analytics', label: 'Analytics', Icon: ChartLineUp },
      { to: '/media', label: 'Media', Icon: Images },
      { to: '/theme', label: 'Theme', Icon: Palette },
      { to: '/map-engine', label: 'Map engine', Icon: GlobeHemisphereWest },
      { to: '/settings', label: 'Settings', Icon: Gear },
    ],
  },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Ico = item.Icon;
  return (
    <Link
      href={item.to}
      className={clsx(
        'group relative flex items-center gap-3 rounded-btn px-3 py-2 text-sm transition-all duration-200',
        active
          ? 'bg-kong/10 text-ink font-semibold'
          : 'text-ink-2 hover:bg-pashmina/50 hover:text-ink hover:translate-x-0.5',
      )}
    >
      {/* Animated active accent bar */}
      <span
        className={clsx(
          'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-kong transition-all duration-300',
          active ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0',
        )}
      />
      <Ico
        size={18}
        weight={active ? 'fill' : 'regular'}
        className={clsx('shrink-0 transition-colors', active ? 'text-kong' : 'text-ink-3 group-hover:text-kong')}
      />
      <span>{item.label}</span>
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = auth.currentUser();

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-64 flex-col border-r border-line bg-white/80 backdrop-blur-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-kong to-kong-deep text-white font-serif text-base shadow-warm">
            K
          </div>
          <div>
            <div className="font-serif text-base font-bold leading-none">Kashmir</div>
            <div className="font-serif italic text-sm leading-none text-kong-deep mt-0.5">Explorer</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
          {NAV.map((group, gi) => (
            <div key={group.heading ?? `g-${gi}`} className="space-y-0.5">
              {group.heading && (
                <div className="px-3 pb-1.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
                  {group.heading}
                </div>
              )}
              {group.items.map((item) => (
                <NavLink key={item.to} item={item} active={isActive(item.to)} />
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-line px-3 py-3">
          <div className="flex items-center gap-3 rounded-btn px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dal/10 text-dal font-semibold text-sm">
              {user?.role?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink capitalize">{user?.role ?? 'Admin'}</div>
              <div className="font-mono text-[10px] text-ink-3 tracking-wider">v0.1.0</div>
            </div>
            <button
              onClick={auth.signOut}
              title="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-btn text-ink-3 transition-colors hover:bg-chinar/10 hover:text-chinar"
            >
              <SignOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
