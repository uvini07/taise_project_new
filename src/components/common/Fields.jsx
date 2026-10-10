import { useId } from "react";

export function Field({ label, hint, error, children, className = "", id }) {
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="field-label">{label}</label>}
      {children}
      {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function TextField({ label, hint, error, className = "", inputClassName = "", ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} className={className} id={id}>
      <input id={id} aria-invalid={!!error} className={`field-input ${inputClassName}`} {...props} />
    </Field>
  );
}

export function TextArea({ label, hint, error, className = "", rows = 4, ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} className={className} id={id}>
      <textarea id={id} rows={rows} aria-invalid={!!error} className="field-input resize-y" {...props} />
    </Field>
  );
}

export function SelectField({ label, hint, error, className = "", children, ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} className={className} id={id}>
      <select id={id} aria-invalid={!!error} className="field-input appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236F625A' stroke-width='1.6'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        {...props}>
        {children}
      </select>
    </Field>
  );
}

export function Checkbox({ label, hint, className = "", ...props }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
        <input id={id} type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink/30 accent-wine-900" {...props} />
        <span>{label}{hint && <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>}</span>
      </label>
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange, disabled }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="text-sm text-ink">
        {label}
        {hint && <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-wine-900" : "bg-ink/20"} disabled:opacity-50`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
