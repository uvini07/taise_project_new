// Polaroidy, o mascote da Revela (versão 2): foto polaroid com espessura,
// rosto no visor, olhos grandes com sobrancelhas, luvinhas e tênis.
// Todas as poses e expressões: brand/revela/polaroidy/mascote-v2/.
// Os SVGs são arquivos do próprio projeto (conteúdo fixo, sem dados de fora).
import feliz from "../../assets/polaroidy/rosto-feliz.svg?raw";
import pensando from "../../assets/polaroidy/rosto-pensando.svg?raw";
import acenando from "../../assets/polaroidy/polaroidy-acenando.svg?raw";

const FACES = { feliz, pensando };

/** Rosto (bolinha flutuante, topo da conversa). Os olhos piscam sozinhos. */
export default function PolaroidyMascot({ className = "h-10 w-10", mood = "feliz" }) {
  return <span className={`pl-svg inline-block shrink-0 ${className}`} aria-hidden dangerouslySetInnerHTML={{ __html: FACES[mood] || feliz }} />;
}

/** Corpo inteiro acenando (abertura da conversa). */
export function PolaroidyWaving({ className = "h-40 w-auto" }) {
  return <span className={`pl-svg inline-block ${className}`} aria-hidden dangerouslySetInnerHTML={{ __html: acenando }} />;
}
