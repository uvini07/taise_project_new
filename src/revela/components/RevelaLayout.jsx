import { useRef } from "react";
import "../revela.css";
import Nav from "./Nav.jsx";
import Footer from "./Footer.jsx";
import { useLensSupport, usePointerSheen } from "../hooks.js";

/**
 * Filtro de refração usado pelo vidro no Chrome/Edge (backdrop-filter: url()).
 * Um ruído bem suave desloca o que está atrás, como uma lâmina de vidro líquido.
 */
function GlassDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <filter id="rv-lens" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.011 0.016" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2.4" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="26" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

export default function RevelaLayout({ children, nav = true, footer = true }) {
  const root = useRef(null);
  useLensSupport();
  usePointerSheen(root);
  return (
    <div className="rv" ref={root}>
      <GlassDefs />
      {nav && <Nav />}
      <main id="conteudo">{children}</main>
      {footer && <Footer />}
    </div>
  );
}
