import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function BrandFooter({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <footer
      className={cn(
        'relative z-10 border-t px-4 py-6',
        dark ? 'border-white/10 text-white/45' : 'border-cafe-border text-cafe-muted',
        className,
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs sm:flex-row">
        <p>Copyright 2026 BAD-EiZA</p>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/c/demo-cafe" className={cn('hover:underline', dark ? 'hover:text-white' : 'hover:text-cafe-ink')}>
            Demo
          </Link>
          <Link to="/pos" className={cn('hover:underline', dark ? 'hover:text-white' : 'hover:text-cafe-ink')}>
            POS
          </Link>
          <Link to="/app" className={cn('hover:underline', dark ? 'hover:text-white' : 'hover:text-cafe-ink')}>
            Merchant
          </Link>
        </nav>
      </div>
    </footer>
  );
}
