import { cn } from '@/lib/utils';

export function GlareCard({
  children,
  className,
  onClick,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  role?: React.AriaRole;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      role={role}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cafe-forest-mid/50 hover:shadow-md',
        className,
      )}
    >
      <div className="pointer-events-none absolute -inset-px opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-cafe-accent/20 via-transparent to-transparent" />
      </div>
      <div className="relative z-10">{children}</div>
    </Comp>
  );
}
