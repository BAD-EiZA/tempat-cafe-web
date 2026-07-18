import { FloatingDock } from '@/components/ui/floating-dock';
import { BackgroundBeamsDark } from '@/components/ui/background-beams';
import { cn } from '@/lib/utils';
import { BrandFooter } from '@/components/ace/BrandFooter';

const DOCK = [
  { title: 'POS', href: '/pos' },
  { title: 'KDS', href: '/kds' },
  { title: 'Waiter', href: '/waiter' },
  { title: 'App', href: '/app' },
];

export function OpsShell({
  children,
  className,
  beams = true,
}: {
  children: React.ReactNode;
  className?: string;
  beams?: boolean;
}) {
  return (
    <div className={cn('relative min-h-screen bg-[#0c0c0c] text-white', className)}>
      {beams && <BackgroundBeamsDark />}
      <div className="relative z-10 min-h-[calc(100vh-3.5rem)] pb-20">{children}</div>
      <BrandFooter dark className="pb-24" />
      <FloatingDock items={DOCK} />
    </div>
  );
}
