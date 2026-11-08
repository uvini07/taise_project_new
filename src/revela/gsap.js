// GSAP da página da Revela: registrado uma vez, só neste pedaço do site.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, useGSAP);
gsap.defaults({ ease: "power3.out", duration: 0.8 });

/** Movimento completo só com tela larga, ponteiro de mouse e sem "reduzir movimento". */
export const MQ = {
  full: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  mid: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
  phone: "(max-width: 767px)",
  reduce: "(prefers-reduced-motion: reduce)",
  pointer: "(hover: hover) and (pointer: fine)",
};

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia(MQ.reduce).matches;

export { gsap, ScrollTrigger, useGSAP };
