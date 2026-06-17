import type { InputHTMLAttributes } from 'react';

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function FormField({ label, hint, id, className = '', ...inputProps }: FormFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-extrabold text-slate-700">{label}</span>
      <input
        id={id}
        className={`mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold text-asphalt outline-none transition placeholder:text-slate-400 focus:border-ember focus:bg-white focus:ring-4 focus:ring-orange-100 ${className}`}
        {...inputProps}
      />
      {hint ? <span className="mt-1 block text-xs font-semibold text-slate-500">{hint}</span> : null}
    </label>
  );
}
