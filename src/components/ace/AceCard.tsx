import { cn } from '@/lib/utils';
import { GlareCard } from '@/components/ui/glare-card';

export function AceCard({
  children,
  className,
  glare,
  onClick,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  glare?: boolean;
  onClick?: () => void;
  role?: React.AriaRole;
}) {
  if (glare || onClick) {
    return (
      <GlareCard className={className} onClick={onClick} role={role}>
        {children}
      </GlareCard>
    );
  }
  return (
    <div
      role={role}
      className={cn(
        'rounded-2xl border border-[#e8e4de] bg-white p-4 shadow-sm transition hover:border-[#c4a574]/40',
        className,
      )}
    >
      {children}
    </div>
  );
}
