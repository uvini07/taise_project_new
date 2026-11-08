import { forwardRef } from "react";
import { LOGO, LOGO_ORDER, LOGO_VB, SYMBOL_VB } from "../logoPaths.js";

/**
 * Logo "revela" desenhada em SVG (letra a letra, para animar).
 * ink = cor das letras, dot = cor da luz. Cada traço tem data-part.
 */
export const Wordmark = forwardRef(function Wordmark(
  { ink = "currentColor", dot = "#C95D63", className = "", title = "Revela", decorative = false, ...rest },
  ref,
) {
  return (
    <svg ref={ref} viewBox={LOGO_VB} className={className} role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined} aria-label={decorative ? undefined : title} {...rest} style={{ overflow: "visible", ...rest.style }}>
      {LOGO_ORDER.map((k) => (
        <path key={k} d={LOGO[k]} data-part={k} fill={k === "dot" ? dot : ink} />
      ))}
    </svg>
  );
});

/** Só o símbolo: o "r" da espiral com a luz. */
export const RevelaSymbol = forwardRef(function RevelaSymbol({ ink = "currentColor", dot = "#C95D63", className = "", decorative = true, ...rest }, ref) {
  return (
    <svg ref={ref} viewBox={SYMBOL_VB} className={className} aria-hidden={decorative || undefined} role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Revela"} {...rest} style={{ overflow: "visible", ...rest.style }}>
      <path d={LOGO.r} data-part="r" fill={ink} />
      <path d={LOGO.dot} data-part="dot" fill={dot} />
    </svg>
  );
});

/** Ícone do app: o símbolo no quadrado arredondado. */
export function AppIcon({ size = 64, className = "", bg = "#2B2540", ink = "#E6E1F0", dot = "#C95D63", style }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.24, background: bg, boxShadow: "inset 0 1px 0 rgba(255,255,255,.18), 0 18px 40px -18px rgba(43,37,64,.6)", ...style }}>
      <RevelaSymbol ink={ink} dot={dot} style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}
