import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export type HoverItem = {
  title: string;
  description: string;
  link?: string;
  onClick?: () => void;
};

export function HoverEffect({
  items,
  className,
}: {
  items: HoverItem[];
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((item) => {
        const inner = (
          <>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cafe-forest-mid/15 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="relative z-10">
              <h3 className="font-semibold text-cafe-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-cafe-muted">{item.description}</p>
            </div>
          </>
        );
        const cls =
          'group relative block h-full rounded-2xl border border-cafe-border bg-cafe-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-cafe-forest-mid/50 hover:shadow-lg';
        if (item.link) {
          return (
            <Link key={item.title} to={item.link} className={cls}>
              {inner}
            </Link>
          );
        }
        return (
          <button key={item.title} type="button" className={cn(cls, 'w-full text-left')} onClick={item.onClick}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
