import { cn } from '@/lib/utils';

export type TimelineItem = {
  title: string;
  description?: string;
  active?: boolean;
  done?: boolean;
};

export function Timeline({
  items,
  className,
}: {
  items: TimelineItem[];
  className?: string;
}) {
  return (
    <ol className={cn('relative space-y-0 border-l-2 border-cafe-border pl-6', className)}>
      {items.map((item, i) => (
        <li key={i} className="mb-6 last:mb-0">
          <span
            className={cn(
              'absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-cafe-card',
              item.done || item.active ? 'bg-cafe-accent' : 'bg-cafe-border',
              item.active && 'ring-4 ring-cafe-accent/30',
            )}
          />
          <p
            className={cn(
              'font-semibold',
              item.active ? 'text-cafe-ink' : 'text-cafe-muted',
            )}
          >
            {item.title}
          </p>
          {item.description && (
            <p className="mt-0.5 text-sm text-cafe-muted">{item.description}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
