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
        'fixed inset-x-0 top-4 z-50 mx-auto flex max-w-4xl items-center justify-between rounded-full border border-[#e8e4de]/80 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-md',
        className,
      )}
    >
      <Link to="/" className="text-sm font-bold tracking-tight text-[#1a1a1a]">
        {brand}
      </Link>
      <nav className="hidden items-center gap-1 sm:flex">
        {navItems.map((n) => (
          <Link
            key={n.link}
            to={n.link}
            className="rounded-full px-3 py-1.5 text-sm text-[#6b6b6b] transition hover:bg-[#f3f0eb] hover:text-[#1a1a1a]"
          >
            {n.name}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
