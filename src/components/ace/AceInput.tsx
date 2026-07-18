import { cn } from '@/lib/utils';

export function AceInput({
  label,
  className,
  containerClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  containerClassName?: string;
}) {
  return (
    <div className={containerClassName}>
      {label && <label className="mb-1.5 block text-sm font-semibold text-[#6b6b6b]">{label}</label>}
      <input
        className={cn(
          'w-full rounded-xl border border-[#d4d0c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#c4a574] focus:ring-2 focus:ring-[#c4a574]/25',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function AceSelect({
  label,
  className,
  containerClassName,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={containerClassName}>
      {label && <label className="mb-1.5 block text-sm font-semibold text-[#6b6b6b]">{label}</label>}
      <select
        className={cn(
          'w-full rounded-xl border border-[#d4d0c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#c4a574] focus:ring-2 focus:ring-[#c4a574]/25',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function AceTextarea({
  label,
  className,
  containerClassName,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  containerClassName?: string;
}) {
  return (
    <div className={containerClassName}>
      {label && <label className="mb-1.5 block text-sm font-semibold text-[#6b6b6b]">{label}</label>}
      <textarea
        className={cn(
          'w-full rounded-xl border border-[#d4d0c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#c4a574] focus:ring-2 focus:ring-[#c4a574]/25',
          className,
        )}
        {...props}
      />
    </div>
  );
}
