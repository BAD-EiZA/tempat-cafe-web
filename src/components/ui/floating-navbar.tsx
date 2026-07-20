import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type NavItem = { name: string; link: string };

export function FloatingNavbar({
  navItems,
  className,
  right,
  brand = 'Cafe Platform',
}: {
  navItems: NavItem[];
  className?: string;
  right?: React.ReactNode;
  brand?: string;
}) {
  return (
    <div
      className={cn(
        'fixed inset-x-2 top-2 z-50 mx-auto flex max-w-5xl flex-wrap items-center gap-1 rounded-2xl border border-cafe-border/80 bg-cafe-card/85 px-3 py-2 shadow-lg backdrop-blur-md sm:inset-x-0 sm:top-4 sm:flex-nowrap sm:px-4 sm:rounded-full',
        className,
      )}
    >
      <Link
        to="/"
        className="flex min-h-11 min-w-0 flex-1 items-center truncate rounded-sm text-sm font-bold tracking-tight text-cafe-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent sm:flex-none"
      >
        {brand}
      </Link>
      <nav
        aria-label="Navigasi utama"
        className="order-last flex w-full items-center gap-1 overflow-x-auto border-t border-cafe-border pt-1 sm:order-none sm:ml-auto sm:w-auto sm:border-0 sm:pt-0"
      >
        {navItems.map((n) => (
          <Link
            key={n.link}
            to={n.link}
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-cafe-muted transition hover:bg-cafe-hover hover:text-cafe-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
          >
            {n.name}
          </Link>
        ))}
      </nav>
      <div className="flex max-w-full shrink-0 items-center gap-1 overflow-x-auto sm:gap-2">{right}</div>
    </div>
  );
}
