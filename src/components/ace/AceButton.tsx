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
    primary: 'bg-[#1a1a1a] text-white hover:bg-black',
    accent: 'bg-[#c4a574] text-[#1a1a1a] hover:brightness-105',
    ghost: 'border border-[#d4d0c8] bg-transparent text-[#1a1a1a] hover:bg-[#f3f0eb]',
    danger: 'bg-[#b91c1c] text-white hover:bg-red-800',
  };

  const Comp = as || 'button';
  return (
    <Comp
      type={as ? undefined : type}
      to={to}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4a574] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}
