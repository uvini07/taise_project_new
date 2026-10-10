import Spinner from "./Spinner.jsx";

export default function PageLoader({ full = false, label = "Carregando…" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-sm text-ink-muted ${full ? "min-h-screen" : "min-h-[40vh]"}`}>
      <Spinner className="h-6 w-6" />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-sand/60 ${className}`} aria-hidden />;
}
