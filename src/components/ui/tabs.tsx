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
        'inline-flex flex-wrap gap-1 rounded-xl border border-[#e8e4de] bg-[#f3f0eb]/60 p-1',
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
              ? 'bg-white text-[#1a1a1a] shadow-sm'
              : 'text-[#6b6b6b] hover:text-[#1a1a1a]',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
