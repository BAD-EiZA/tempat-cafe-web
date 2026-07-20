import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type SidebarLink = {
  label: string;
  href: string;
  end?: boolean;
  icon?: React.ReactNode;
};

export type SidebarGroup = {
  label: string;
  links: SidebarLink[];
};

export function AceSidebar({
  brand = 'Merchant',
  groups,
  links,
  footer,
  className,
}: {
  brand?: string;
  groups?: SidebarGroup[];
  links?: SidebarLink[];
  footer?: React.ReactNode;
  className?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections: SidebarGroup[] =
    groups?.length
      ? groups
      : links?.length
        ? [{ label: '', links }]
        : [];

  return (
    <aside
      className={cn(
        'relative z-20 flex w-full flex-col border-b border-cafe-border bg-cafe-card md:sticky md:top-0 md:h-[100dvh] md:w-64 md:shrink-0 md:border-b-0 md:border-r',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-cafe-border px-4 py-3.5">
        <Link
          to="/app"
          className="min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
        >
          <span className="block truncate text-base font-bold tracking-tight text-cafe-ink">
            {brand}
          </span>
          <span className="block text-[11px] font-medium text-cafe-muted">Merchant app</span>
        </Link>
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="merchant-navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cafe-border text-cafe-ink md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
        >
          {mobileOpen ? <X weight="bold" className="h-5 w-5" /> : <List weight="bold" className="h-5 w-5" />}
          <span className="sr-only">{mobileOpen ? 'Tutup menu' : 'Buka menu'}</span>
        </button>
      </div>

      <nav
        id="merchant-navigation"
        aria-label="Navigasi merchant"
        className={cn(
          'flex-1 flex-col gap-4 overflow-y-auto px-2 py-3 md:flex',
          mobileOpen ? 'flex max-h-[70vh]' : 'hidden md:flex',
        )}
      >
        {sections.map((group) => (
          <div key={group.label || 'main'}>
            {group.label ? (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-cafe-muted">
                {group.label}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {group.links.map((l) => (
                <NavLink
                  key={l.href}
                  to={l.href}
                  end={l.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-1',
                      isActive
                        ? 'bg-cafe-forest text-cafe-card shadow-sm'
                        : 'text-cafe-muted hover:bg-cafe-hover hover:text-cafe-ink',
                    )
                  }
                >
                  {l.icon && (
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-4.5 [&>svg]:w-4.5">
                      {l.icon}
                    </span>
                  )}
                  <span className="truncate">{l.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {footer && (
        <div
          className={cn(
            'mt-auto border-t border-cafe-border p-3 md:block md:p-4',
            mobileOpen ? 'block' : 'hidden md:block',
          )}
        >
          {footer}
        </div>
      )}
    </aside>
  );
}
