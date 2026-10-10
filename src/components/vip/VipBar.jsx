import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import Countdown from "./Countdown.jsx";
import { Sparkle } from "../common/SectionHeading.jsx";

/** Faixa fina no topo com a campanha VIP ativa e seu contador. */
export default function VipBar({ campaign, phase }) {
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem(`tf-vipbar-${campaign.id}`) === "1"; } catch { return false; }
  });
  if (hidden) return null;
  const close = () => {
    try { sessionStorage.setItem(`tf-vipbar-${campaign.id}`, "1"); } catch { /* sem armazenamento */ }
    setHidden(true);
  };
  const text = phase.vipAccess ? "Acesso VIP liberado" : phase.phase === "open" ? "Lista VIP aberta" : campaign.name;
  return (
    <div className="relative z-[55] bg-wine-950 text-cream">
      <div className="container-x flex min-h-10 items-center justify-center gap-3 py-2 pr-10 text-center text-xs sm:text-[13px]">
        <Sparkle className="hidden h-2.5 w-2.5 text-gold-light sm:block" />
        <span className="font-medium">{text}: {campaign.name}</span>
        {phase.countdownEnd && <span className="hidden text-cream/60 sm:inline">termina em</span>}
        {phase.countdownEnd && <Countdown target={phase.countdownEnd} tone="light" compact />}
        <Link to={`/vip/${campaign.slug}`} className="ml-1 underline decoration-gold-light underline-offset-4 hover:text-white">
          {phase.vipAccess ? "Acessar" : "Quero participar"}
        </Link>
      </div>
      <button onClick={close} aria-label="Fechar aviso da campanha" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-cream/60 hover:text-cream">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
