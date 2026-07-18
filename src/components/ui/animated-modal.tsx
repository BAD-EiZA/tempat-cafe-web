import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export function AnimatedModal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          'animate-float-up relative z-10 w-full max-w-md rounded-2xl border border-[#e8e4de] bg-white p-5 shadow-2xl',
          className,
        )}
      >
        {title && <h3 className="mb-3 text-lg font-bold">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
