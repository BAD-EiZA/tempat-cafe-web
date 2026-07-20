import { cn } from '@/lib/utils';

export function AceTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-xl border border-cafe-border bg-cafe-hover/60 p-1',
        className,
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            value === t.id
              ? 'bg-cafe-card text-cafe-ink shadow-sm'
              : 'text-cafe-muted hover:text-cafe-ink',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
