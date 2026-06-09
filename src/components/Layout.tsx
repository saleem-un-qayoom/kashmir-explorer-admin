'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  Sun,
  Moon,
  CaretDown,
  type Icon as PhIcon,
} from '@phosphor-icons/react';
import { auth } from '@/lib/auth';

type NavItem = { to: string; label: string; Icon: PhIcon };
type NavGroup = { heading: string | null; items: NavItem[] };

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
        'group relative flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm transition-all duration-200',
        active
          ? 'bg-kong/10 text-ink font-semibold'
          : 'text-ink-2 hover:bg-pashmina/50 hover:text-ink hover:translate-x-0.5',
      )}
    >
      <span
        className={clsx(
          'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-kong to-kong-deep transition-all duration-300',
          active ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 group-hover:scale-y-100 group-hover:opacity-40',
        )}
      />
      <Ico
        size={18}
        weight={active ? 'fill' : 'regular'}
        className={clsx('shrink-0 transition-colors duration-200', active ? 'text-kong' : 'text-ink-3 group-hover:text-kong')}
      />
      <span>{item.label}</span>
    </Link>
  );
}

function NavGroup({ group, isActive }: { group: NavGroup; isActive: (to: string) => boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  if (!group.heading) {
    return (
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-mono font-semibold tracking-[0.12em] text-ink-3 uppercase transition-colors hover:text-ink cursor-pointer"
      >
        <span>{group.heading}</span>
        <CaretDown
          size={12}
          weight="bold"
          className={clsx('transition-transform duration-200', collapsed ? '-rotate-90' : '')}
        />
      </button>
      <div className={clsx('space-y-0.5 overflow-hidden transition-all duration-300', collapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100')}>
        {group.items.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} />
        ))}
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = auth.currentUser();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('kashmir-admin-theme');
    if (stored === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('kashmir-admin-theme', next ? 'dark' : 'light');
  };

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-64 flex-col border-r border-line bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-dark-line dark:bg-dark-surface/80">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line dark:border-dark-line">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-kong via-kong to-kong-deep text-white font-serif text-base shadow-warm animate-float">
            K
          </div>
          <div>
            <div className="font-serif text-base font-bold leading-none text-ink dark:text-dark-text">Kashmir</div>
            <div className="font-serif italic text-sm leading-none text-kong-deep mt-0.5">Explorer</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4 scrollbar-thin">
          {NAV.map((group, gi) => (
            <NavGroup key={group.heading ?? `g-${gi}`} group={group} isActive={isActive} />
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-line dark:border-dark-line px-3 py-3">
          <div className="flex items-center gap-3 rounded-btn px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dal/10 text-dal dark:bg-dal/20 dark:text-pashmina font-semibold text-sm">
              {user?.role?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink dark:text-dark-text capitalize">{user?.role ?? 'Admin'}</div>
              <div className="font-mono text-[10px] text-ink-3 dark:text-dark-text-3 tracking-wider">v0.1.0</div>
            </div>
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-8 w-8 items-center justify-center rounded-btn text-ink-3 dark:text-dark-text-3 transition-colors hover:bg-kong/10 hover:text-kong cursor-pointer"
            >
              {dark ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
            </button>
            <button
              onClick={auth.signOut}
              title="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-btn text-ink-3 dark:text-dark-text-3 transition-colors hover:bg-chinar/10 hover:text-chinar cursor-pointer"
            >
              <SignOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-pashmina/30 dark:bg-dark-bg transition-colors duration-300">{children}</main>
    </div>
  );
}
