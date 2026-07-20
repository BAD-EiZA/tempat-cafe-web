import { FloatingDock } from '@/components/ui/floating-dock';
import { cn } from '@/lib/utils';

const DOCK = [
  { title: 'POS', href: '/pos', icon: 'pos' as const },
  { title: 'KDS', href: '/kds', icon: 'kds' as const },
  { title: 'Waiter', href: '/waiter', icon: 'waiter' as const },
  { title: 'App', href: '/app', icon: 'app' as const },
];

export function OpsShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-ops
      className={cn(
        'relative min-h-[100dvh] bg-[var(--ops-bg)] text-[var(--ops-ink)]',
        className,
      )}
    >
      <div className="relative z-10 min-h-[100dvh] pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <FloatingDock items={DOCK} />
    </div>
  );
}
