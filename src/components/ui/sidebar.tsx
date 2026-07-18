import { useState } from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <aside
      className={cn(
        'relative z-20 flex w-full flex-col border-b border-[#e8e4de] bg-white/90 backdrop-blur md:w-60 md:border-b-0 md:border-r',
        className,
      )}
    >
      <div className="flex items-center justify-between p-4">
        <Link to="/" className="rounded-sm text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4a574]">
          {brand}
        </Link>
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="merchant-navigation"
          className="rounded-lg border border-[#d4d0c8] px-3 py-1.5 text-sm font-semibold md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
        >
          {mobileOpen ? 'Tutup' : 'Menu'}
        </button>
      </div>
      <nav
        id="merchant-navigation"
        aria-label="Navigasi merchant"
        className={cn(
          'max-h-[60vh] flex-1 flex-col gap-1 overflow-y-auto px-2 pb-3 md:flex md:max-h-none',
          mobileOpen ? 'flex' : 'hidden',
        )}
      >
        {links.map((l) => (
          <NavLink
            key={l.href}
            to={l.href}
            end={l.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                 'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4a574] focus-visible:ring-offset-1',
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
      {footer && (
        <div className={cn('border-t border-[#e8e4de] p-3 md:block md:p-4', mobileOpen ? 'block' : 'hidden')}>
          {footer}
        </div>
      )}
    </aside>
  );
}
