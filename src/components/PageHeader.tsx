import { type ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-pashmina/70 backdrop-blur-md px-8 py-5">
      <div className="animate-rise">
        <h1 className="font-serif text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {action && <div className="animate-rise" style={{ animationDelay: '0.06s' }}>{action}</div>}
    </div>
  );
}
