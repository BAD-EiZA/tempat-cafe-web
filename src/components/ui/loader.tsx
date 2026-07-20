import { cn } from '@/lib/utils';

export function Loader({ className, label = 'Memuat…' }: { className?: string; label?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('flex flex-col items-center justify-center gap-3 p-8', className)}>
      <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-cafe-accent border-t-transparent" />
      <p className="text-sm text-cafe-muted">{label}</p>
    </div>
  );
}

export function MultiStepLoader({
  steps,
  active,
  className,
}: {
  steps: string[];
  active: number;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={cn('space-y-2', className)}>
      {steps.map((s, i) => (
        <div
          key={s}
          aria-current={i === active ? 'step' : undefined}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
            i === active && 'bg-cafe-accent/15 font-semibold text-cafe-ink',
            i < active && 'text-cafe-ok',
            i > active && 'text-cafe-muted',
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cafe-card text-xs shadow-sm">
            {i < active ? '✓' : i + 1}
          </span>
          {s}
        </div>
      ))}
    </div>
  );
}
