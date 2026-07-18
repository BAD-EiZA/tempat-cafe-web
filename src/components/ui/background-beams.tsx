import { cn } from '@/lib/utils';

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]',
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#faf8f5] via-transparent to-[#faf8f5]" />
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="animate-beam absolute w-px bg-gradient-to-b from-transparent via-[#c4a574]/70 to-transparent"
          style={{
            left: `${12 + i * 15}%`,
            height: '40%',
            animationDelay: `${i * 1.2}s`,
            animationDuration: `${7 + i}s`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-dot-grid opacity-40" />
    </div>
  );
}

export function BackgroundBeamsDark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent_85%)]',
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-dot-grid-dark opacity-60" />
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="animate-beam absolute w-px bg-gradient-to-b from-transparent via-[#c4a574]/50 to-transparent"
          style={{
            left: `${18 + i * 16}%`,
            height: '50%',
            animationDelay: `${i * 1.4}s`,
            animationDuration: `${8 + i}s`,
          }}
        />
      ))}
    </div>
  );
}
