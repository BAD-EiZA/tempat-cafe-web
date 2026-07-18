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
        'relative inline-flex overflow-hidden rounded-xl p-[1px] focus:outline-none',
        containerClassName,
      )}
      {...props}
    >
      <span
        className={cn(
          'absolute inset-[-100%] animate-[border-spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#faf8f5_0%,#c4a574_50%,#1a1a1a_100%)]',
          borderClassName,
        )}
      />
      <span
        className={cn(
          'relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-[11px] bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white',
          className,
        )}
      >
        {children}
      </span>
    </Comp>
  );
}
