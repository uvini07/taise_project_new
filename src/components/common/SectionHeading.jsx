import Reveal from "./Reveal.jsx";

export function Sparkle({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-3 w-3 ${className}`} fill="currentColor" aria-hidden>
      <path d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0Z" />
    </svg>
  );
}

/** Linha fina com a estrelinha da logo no meio. */
export function Divider({ className = "" }) {
  return (
    <div className={`flex items-center gap-3 text-gold ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-current opacity-40" />
      <Sparkle />
      <span className="h-px flex-1 bg-current opacity-40" />
    </div>
  );
}

export default function SectionHeading({ eyebrow, title, text, align = "left", className = "", as: H = "h2" }) {
  const center = align === "center";
  return (
    <Reveal className={`${center ? "mx-auto text-center" : ""} max-w-2xl ${className}`}>
      {eyebrow && (
        <p className={`eyebrow flex items-center gap-2 ${center ? "justify-center" : ""}`}>
          <Sparkle className="h-2.5 w-2.5" /> {eyebrow}
        </p>
      )}
      <H className="display-lg mt-3 text-balance">{title}</H>
      {text && <p className="lead mt-4 text-pretty">{text}</p>}
    </Reveal>
  );
}
