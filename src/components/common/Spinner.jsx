export default function Spinner({ className = "h-5 w-5", label = "Carregando" }) {
  return (
    <span role="status" className="inline-flex items-center">
      <svg className={`animate-spin text-gold ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
