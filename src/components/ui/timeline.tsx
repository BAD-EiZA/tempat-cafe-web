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
    <ol className={cn('relative space-y-0 border-l-2 border-[#e8e4de] pl-6', className)}>
      {items.map((item, i) => (
        <li key={i} className="mb-6 last:mb-0">
          <span
            className={cn(
              'absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-white',
              item.done || item.active ? 'bg-[#c4a574]' : 'bg-[#d4d0c8]',
              item.active && 'ring-4 ring-[#c4a574]/30',
            )}
          />
          <p
            className={cn(
              'font-semibold',
              item.active ? 'text-[#1a1a1a]' : 'text-[#6b6b6b]',
            )}
          >
            {item.title}
          </p>
          {item.description && (
            <p className="mt-0.5 text-sm text-[#6b6b6b]">{item.description}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
