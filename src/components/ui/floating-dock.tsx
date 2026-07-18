import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type DockItem = { title: string; href: string };

export function FloatingDock({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-black/70 px-2 py-2 shadow-2xl backdrop-blur-md',
        className,
      )}
    >
      {items.map((it) => (
        <Link
          key={it.href}
          to={it.href}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          title={it.title}
        >
          {it.title}
        </Link>
      ))}
    </div>
  );
}
