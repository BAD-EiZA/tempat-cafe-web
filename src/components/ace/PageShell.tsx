import { cn } from '@/lib/utils';
import { BackgroundBeams, BackgroundBeamsDark } from '@/components/ui/background-beams';
import { Spotlight } from '@/components/ui/spotlight';

export function PageShell({
  children,
  className,
  variant = 'light',
  beams = true,
  spotlight = false,
  maxWidth = 'max-w-5xl',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'plain';
  beams?: boolean;
  spotlight?: boolean;
  maxWidth?: string;
}) {
  const dark = variant === 'dark';
  return (
    <div
      className={cn(
        'relative min-h-screen',
        dark ? 'bg-[#0c0c0c] text-white' : 'bg-[#faf8f5] text-[#1a1a1a]',
        className,
      )}
    >
      {variant !== 'plain' && beams && (dark ? <BackgroundBeamsDark /> : <BackgroundBeams />)}
      {spotlight && !dark && <Spotlight />}
      <div className={cn('relative z-10 mx-auto w-full px-4 py-6', maxWidth)}>{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#e8e4de] bg-white/90 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#c4a574]/50 hover:shadow-md',
        className,
      )}
    >
      <div className="text-sm text-[#6b6b6b]">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d4d0c8] bg-white/50 px-6 py-12 text-center">
      <p className="font-semibold text-[#1a1a1a]">{title}</p>
      {description && <p className="mt-1 text-sm text-[#6b6b6b]">{description}</p>}
    </div>
  );
}

export function AceBadge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'ok' | 'warn' | 'info' | 'danger';
}) {
  const tones = {
    default: 'bg-[#eee] text-[#1a1a1a]',
    ok: 'bg-green-100 text-green-800',
    warn: 'bg-amber-100 text-amber-900',
    info: 'bg-blue-100 text-blue-900',
    danger: 'bg-red-100 text-red-800',
  };
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-bold', tones[tone])}>
      {children}
    </span>
  );
}
