'use client';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 border-l-4 border-l-kong dark:border-l-kong transition-all duration-200 hover:shadow-lg">
      <h3 className="font-heading text-sm font-semibold tracking-wider text-kong-deep dark:text-kong/40 mb-5 uppercase">{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-200">
        {label} {required && <span className="text-orange-500 dark:text-orange-400 font-bold">*</span>}
      </label>
      {children}
    </div>
  );
}

export function Row({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <label className="block text-xs font-medium text-ink-2 mb-0.5">{label}</label>
      <span className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
