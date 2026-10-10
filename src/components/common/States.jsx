import { AlertTriangle, ImageOff } from "lucide-react";

export function EmptyState({ icon: Icon = ImageOff, title, text, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white/50 px-6 py-12 text-center ${className}`}>
      <Icon className="mb-3 h-8 w-8 text-gold" strokeWidth={1.4} aria-hidden />
      <h3 className="font-display text-2xl">{title}</h3>
      {text && <p className="mt-2 max-w-md text-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Não foi possível carregar." }) {
  const denied = error?.code === "permission-denied";
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-6 py-10 text-center">
      <AlertTriangle className="h-7 w-7 text-danger" strokeWidth={1.5} aria-hidden />
      <p className="font-medium text-ink">{title}</p>
      <p className="max-w-md text-sm text-ink-muted">
        {denied
          ? "Acesso negado pelas regras de segurança. Confira se as regras do Firestore foram publicadas e se o seu usuário é administrador."
          : error?.message || "Verifique sua conexão e tente novamente."}
      </p>
      {onRetry && <button className="btn-outline btn-sm" onClick={onRetry}>Tentar de novo</button>}
    </div>
  );
}
