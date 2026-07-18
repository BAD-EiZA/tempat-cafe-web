import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type SidebarLink = { label: string; href: string; end?: boolean };

export function AceSidebar({
  brand = 'Cafe Merchant',
  links,
  footer,
  className,
}: {
  brand?: string;
  links: SidebarLink[];
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        'flex w-full flex-col border-b border-[#e8e4de] bg-white/90 backdrop-blur md:w-60 md:border-b-0 md:border-r',
        className,
      )}
    >
      <div className="p-4">
        <Link to="/" className="text-lg font-bold tracking-tight">
          {brand}
        </Link>
      </div>
      <nav className="flex flex-1 gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-y-auto">
        {links.map((l) => (
          <NavLink
            key={l.href}
            to={l.href}
            end={l.end}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-[#1a1a1a] text-white shadow-sm'
                  : 'text-[#6b6b6b] hover:bg-[#f3f0eb] hover:text-[#1a1a1a]',
              )
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      {footer && <div className="hidden border-t border-[#e8e4de] p-4 md:block">{footer}</div>}
    </aside>
  );
}
