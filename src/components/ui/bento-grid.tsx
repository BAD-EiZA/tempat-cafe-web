import { cn } from '@/lib/utils';

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', className)}>
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
  onClick,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group/bento relative flex min-h-[140px] flex-col justify-between space-y-3 overflow-hidden rounded-2xl border border-cafe-border bg-cafe-card p-5 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-cafe-forest-mid/50 hover:shadow-md',
        className,
      )}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-1">
        {icon}
        <div className="mt-2 font-semibold text-cafe-ink">{title}</div>
        <div className="mt-1 text-sm text-cafe-muted">{description}</div>
      </div>
    </Comp>
  );
}
