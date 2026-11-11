import { useEffect } from "react";
import RevelaLayout from "../components/RevelaLayout.jsx";
import Hero from "../sections/Hero.jsx";
import DotStatement from "../sections/DotStatement.jsx";
import Unify from "../sections/Unify.jsx";
import Features from "../sections/Features.jsx";
import HowItWorks from "../sections/HowItWorks.jsx";
import PlansSection from "../sections/PlansSection.jsx";
import Showcase from "../sections/Showcase.jsx";
import SiteBuilder from "../sections/SiteBuilder.jsx";
import Polaroidy from "../sections/Polaroidy.jsx";
import Close from "../sections/Close.jsx";
import { ScrollTrigger } from "../gsap.js";
import { useHashScroll, useRevelaMeta } from "../hooks.js";

export default function RevelaHome() {
  useRevelaMeta(null, "Monte seu site em minutos com 10 modelos, receba agendamentos com sinal, deixe o cliente escolher as fotos com proteção contra print, entregue em alta e conte com a Polaroidy, sua assistente com IA. Planos a partir de R$ 89 por mês.");
  useHashScroll();
  // A fonte da marca muda a altura dos títulos: recalcula as cenas presas à rolagem.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
    return () => { alive = false; };
  }, []);
  return (
    <RevelaLayout>
      <Hero />
      <DotStatement />
      <Unify />
      <SiteBuilder />
      <Polaroidy />
      <Features />
      <HowItWorks />
      <PlansSection />
      <Showcase />
      <Close />
    </RevelaLayout>
  );
}
