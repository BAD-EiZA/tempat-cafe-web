import { cn } from '@/lib/utils';
import { MovingBorderButton } from '@/components/ui/moving-border';

type Variant = 'primary' | 'accent' | 'ghost' | 'danger' | 'border';

export function AceButton({
  children,
  className,
  variant = 'primary',
  type = 'button',
  disabled,
  onClick,
  as,
  to,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
  as?: any;
  to?: string;
  [key: string]: any;
}) {
  if (variant === 'border') {
    return (
      <MovingBorderButton
        as={as}
        to={to}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={className}
        {...rest}
      >
        {children}
      </MovingBorderButton>
    );
  }

  const variants: Record<string, string> = {
    primary: 'bg-cafe-forest text-cafe-card hover:bg-cafe-forest-mid',
    accent: 'bg-cafe-accent text-cafe-ink hover:brightness-105',
    ghost: 'border border-cafe-border bg-transparent text-cafe-ink hover:bg-cafe-hover',
    danger: 'bg-cafe-danger text-white hover:bg-red-800',
  };

  const Comp = as || 'button';
  return (
    <Comp
      type={as ? undefined : type}
      to={to}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}
