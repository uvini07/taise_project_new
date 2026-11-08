import { Aperture, Camera, Polaroid } from "./Objects.jsx";
import { RevelaSymbol } from "./Logo.jsx";

const IMG = (n) => `/revela/img/${n}.webp`;

/** Fundo das telas de entrar e de cadastro: luz, o "r" de vidro e objetos flutuando. */
export default function AuthScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="rv-ground">
        <span className="rv-blob" style={{ left: "52%", top: "-26%", width: "64vw", height: "64vw", background: "radial-gradient(closest-side, rgba(201,93,99,.4), rgba(201,93,99,0))" }} />
        <span className="rv-blob" style={{ left: "-22%", top: "18%", width: "60vw", height: "60vw", background: "radial-gradient(closest-side, rgba(142,134,166,.55), rgba(142,134,166,0))" }} />
        <span className="rv-blob" style={{ left: "30%", top: "46%", width: "48vw", height: "48vw", background: "radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,255,255,0))" }} />
      </div>
      <div className="absolute -right-[6%] top-[6%] hidden h-[86%] opacity-60 lg:block">
        <RevelaSymbol className="h-full w-auto" ink="rgba(255,255,255,.55)" dot="#C95D63" />
      </div>
      <div className="absolute right-[8%] top-[14%] hidden w-[150px] lg:block"><div className="rv-float b"><Polaroid src={IMG("gestante-vestido")} className="rotate-[7deg]" /></div></div>
      <div className="absolute right-[24%] top-[46%] hidden w-[132px] xl:block"><div className="rv-float c"><Polaroid src={IMG("casal-folhas")} className="-rotate-[9deg]" /></div></div>
      <div className="absolute bottom-[8%] right-[8%] hidden w-[230px] lg:block"><div className="rv-float"><Camera className="h-auto w-full -rotate-6" /></div></div>
      <div className="absolute bottom-[7%] left-[55%] hidden w-[112px] lg:block"><div className="rv-float c"><Aperture className="h-auto w-full" open={30} /></div></div>
    </div>
  );
}
