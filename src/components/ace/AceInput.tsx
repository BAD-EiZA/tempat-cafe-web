import { useId } from 'react';
import { cn } from '@/lib/utils';

type FieldProps = {
  label?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  containerClassName?: string;
};

function FieldMessages({ id, hint, error }: { id: string; hint?: React.ReactNode; error?: React.ReactNode }) {
  return (
    <>
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#6b6b6b]">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-700">{error}</p>}
    </>
  );
}

export function AceInput({
  label, hint, error, className, containerClassName, id: providedId,
  'aria-describedby': describedBy, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const descriptionIds = [describedBy, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={containerClassName}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#6b6b6b]">{label}</label>}
      <input
        {...props}
        id={id}
        aria-describedby={descriptionIds}
        aria-errormessage={error ? `${id}-error` : props['aria-errormessage']}
        aria-invalid={error ? true : props['aria-invalid']}
        className={cn(
          'w-full rounded-xl border border-[#d4d0c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#c4a574] focus:ring-2 focus:ring-[#c4a574]/25',
          className,
        )}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

export function AceSelect({
  label, hint, error, className, containerClassName, children, id: providedId,
  'aria-describedby': describedBy, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & FieldProps & { children: React.ReactNode }) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const descriptionIds = [describedBy, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={containerClassName}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#6b6b6b]">{label}</label>}
      <select
        {...props}
        id={id}
        aria-describedby={descriptionIds}
        aria-errormessage={error ? `${id}-error` : props['aria-errormessage']}
        aria-invalid={error ? true : props['aria-invalid']}
        className={cn(
          'w-full rounded-xl border border-[#d4d0c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#c4a574] focus:ring-2 focus:ring-[#c4a574]/25',
          className,
        )}
      >
        {children}
      </select>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

export function AceTextarea({
  label, hint, error, className, containerClassName, id: providedId,
  'aria-describedby': describedBy, ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const descriptionIds = [describedBy, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={containerClassName}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#6b6b6b]">{label}</label>}
      <textarea
        {...props}
        id={id}
        aria-describedby={descriptionIds}
        aria-errormessage={error ? `${id}-error` : props['aria-errormessage']}
        aria-invalid={error ? true : props['aria-invalid']}
        className={cn(
          'w-full rounded-xl border border-[#d4d0c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#c4a574] focus:ring-2 focus:ring-[#c4a574]/25',
          className,
        )}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}
