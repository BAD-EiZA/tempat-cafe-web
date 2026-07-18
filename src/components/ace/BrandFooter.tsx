import { cn } from '@/lib/utils';

export function BrandFooter({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <footer
      className={cn(
        'relative z-10 px-4 py-5 text-center text-xs',
        dark ? 'text-white/45' : 'text-[#6b6b6b]',
        className,
      )}
    >
      Copyright 2026 BAD-EiZA
    </footer>
  );
}
