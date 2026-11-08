// GSAP da página da Revela: registrado uma vez, só neste pedaço do site.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, useGSAP);
gsap.defaults({ ease: "power3.out", duration: 0.8 });

/** Cenas presas à rolagem: tablet e computador. O ponteiro só no computador. */
export const MQ = {
  full: "(min-width: 1024px)",
  mid: "(min-width: 768px)",
  phone: "(max-width: 767px)",
  pointer: "(hover: hover) and (pointer: fine)",
};

export { gsap, ScrollTrigger, useGSAP };
