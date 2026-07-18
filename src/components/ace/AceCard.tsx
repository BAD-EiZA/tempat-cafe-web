import { cn } from '@/lib/utils';
import { GlareCard } from '@/components/ui/glare-card';

export function AceCard({
  children,
  className,
  glare,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  glare?: boolean;
  onClick?: () => void;
}) {
  if (glare || onClick) {
    return (
      <GlareCard className={className} onClick={onClick}>
        {children}
      </GlareCard>
    );
  }
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm transition hover:border-[#c4a574]/40',
        className,
      )}
    >
      {children}
    </div>
  );
}
