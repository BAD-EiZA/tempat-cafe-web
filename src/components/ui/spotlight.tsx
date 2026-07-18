import { cn } from '@/lib/utils';

export function Spotlight({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
      aria-hidden
    >
      <div
        className="animate-spotlight absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full opacity-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(196,165,116,0.35) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
