import { NavLink } from 'react-router-dom';
import {
  CashRegister,
  CookingPot,
  HandWaving,
  House,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type DockItem = {
  title: string;
  href: string;
  icon?: 'pos' | 'kds' | 'waiter' | 'app';
};

const ICONS = {
  pos: CashRegister,
  kds: CookingPot,
  waiter: HandWaving,
  app: House,
};

export function FloatingDock({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Navigasi floor"
      className={cn(
        'fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-stretch gap-1 rounded-2xl border border-white/10 bg-[var(--ops-panel,#171d19)]/95 px-2 py-1.5 shadow-2xl backdrop-blur-md',
        'pb-[max(0.375rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {items.map((it) => {
        const Icon = it.icon ? ICONS[it.icon] : null;
        return (
          <NavLink
            key={it.href}
            to={it.href}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 min-w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition',
                isActive
                  ? 'bg-[var(--ops-forest,#2d6a4f)] text-[var(--ops-ink,#f4f1ea)]'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
              )
            }
          >
            {Icon && <Icon weight="duotone" className="h-5 w-5" />}
            <span>{it.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
