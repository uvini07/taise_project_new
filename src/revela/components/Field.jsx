import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputCls = "w-full rounded-2xl border border-white/80 bg-white/75 px-4 py-3.5 text-[16px] text-rv-ameixa placeholder:text-rv-lilas/80 outline-none transition focus:border-rv-rosa focus:ring-4 focus:ring-rv-rosa/15 aria-[invalid=true]:border-rv-rosa";

/** Campo com rótulo, dica e erro ligados por aria. */
export function Field({ label, hint, error, children, className = "" }) {
  const id = useId();
  const describedBy = [hint && `${id}-h`, error && `${id}-e`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[14px] font-medium text-rv-ameixa">{label}</label>
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && <p id={`${id}-h`} className="mt-1.5 text-[13px] text-rv-ink2">{hint}</p>}
      {error && <p id={`${id}-e`} className="mt-1.5 text-[13px] font-medium text-rv-rosa">{error}</p>}
    </div>
  );
}

export function TextInput({ label, hint, error, className, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={inputCls} {...props} />
      )}
    </Field>
  );
}

export function PasswordInput({ label = "Senha", hint, error, className, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input id={id} type={show ? "text" : "password"} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={`${inputCls} pr-12`} {...props} />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Esconder senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-rv-ink2 hover:bg-rv-lavanda">
            {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
      )}
    </Field>
  );
}

export { inputCls };
