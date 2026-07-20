import { cn } from '@/lib/utils';

export function MovingBorderButton({
  children,
  className,
  containerClassName,
  borderClassName,
  as: Comp = 'button',
  duration = 3000,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: any;
  duration?: number;
  [key: string]: any;
}) {
  return (
    <Comp
      className={cn(
        'relative inline-flex overflow-hidden rounded-xl p-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2',
        containerClassName,
      )}
      {...props}
    >
      <span
        className={cn(
          'absolute inset-[-100%] animate-[border-spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,var(--bg)_0%,var(--accent)_45%,var(--forest)_100%)]',
          borderClassName,
        )}
        style={{ animationDuration: `${duration}ms` }}
      />
      <span
        className={cn(
          'relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-[11px] bg-cafe-forest px-5 py-2.5 text-sm font-semibold text-cafe-card',
          className,
        )}
      >
        {children}
      </span>
    </Comp>
  );
}
