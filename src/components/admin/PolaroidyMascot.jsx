// Polaroidy, o mascote da Revela: corpo de foto polaroid, rosto no visor,
// braços e pernas de desenho animado. Cores da Revela.
// Arquivos de todas as poses: brand/revela/polaroidy/mascote/.
const A = "#2B2540", R = "#C95D63", L = "#E6E1F0", LI = "#8E86A6", N = "#F7F5FA";

/** Rostinho (olhos que piscam, sorriso, bochechas rosadas). */
function Face({ cx, cy, s = 1, blink }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <g className={blink ? "animate-[polaroidy-blink_4s_ease-in-out_infinite]" : ""} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <ellipse cx="-20" cy="-6" rx="7.5" ry="9.5" fill={L} />
        <ellipse cx="20" cy="-6" rx="7.5" ry="9.5" fill={L} />
        <circle cx="-17.5" cy="-9.5" r="3" fill="#fff" />
        <circle cx="22.5" cy="-9.5" r="3" fill="#fff" />
      </g>
      <path d="M-15 12 Q0 26 15 12" fill="none" stroke={L} strokeWidth="5" strokeLinecap="round" />
      <circle cx="-31" cy="10" r="6" fill={R} opacity=".6" />
      <circle cx="31" cy="10" r="6" fill={R} opacity=".6" />
    </g>
  );
}

/** Só o rosto, para a bolinha flutuante e o topo da conversa. */
export default function PolaroidyMascot({ className = "h-10 w-10", blink = false }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="60" r="60" fill={A} />
      <Face cx={60} cy={62} s={0.95} blink={blink} />
      <circle cx="88" cy="30" r="7" fill={R} />
      <rect x="18" y="18" width="84" height="84" rx="18" fill="none" stroke={N} strokeOpacity=".18" strokeWidth="3" />
    </svg>
  );
}

const limb = (d) => <path d={d} fill="none" stroke={A} strokeWidth="7" strokeLinecap="round" />;
const mitt = (x, y) => <circle cx={x} cy={y} r="11" fill={N} stroke={A} strokeWidth="5" />;
const shoe = (x, y, f) => (
  <>
    <ellipse cx={x + 5 * f} cy={y - 2} rx="17" ry="9.5" fill={A} />
    <circle cx={x + 9 * f} cy={y - 5} r="3" fill={R} />
  </>
);

/** Corpo inteiro, acenando (abertura da conversa). */
export function PolaroidyWaving({ className = "h-40 w-auto" }) {
  return (
    <svg viewBox="0 0 240 270" className={className} aria-hidden>
      {limb("M102 186 C100 205 98 222 96 238")}{limb("M138 186 C140 205 142 222 144 238")}
      {shoe(96, 246, -1)}{shoe(144, 246, 1)}
      {limb("M60 120 C42 128 36 142 34 156")}{mitt(34, 162)}
      <g className="origin-[180px_112px] animate-[polaroidy-wave_1.6s_ease-in-out_infinite]">
        {limb("M180 112 C198 100 204 82 202 66")}{mitt(202, 58)}
      </g>
      <path d="M220 48 q6 8 0 16 M228 42 q9 13 0 26" fill="none" stroke={LI} strokeWidth="3.5" strokeLinecap="round" />
      <rect x="60" y="40" width="120" height="146" rx="18" fill={N} stroke={A} strokeWidth="6" />
      <rect x="74" y="54" width="92" height="88" rx="11" fill={A} />
      <Face cx={120} cy={98} blink />
      <circle cx="153" cy="66" r="6.5" fill={R} />
      <rect x="96" y="158" width="48" height="6" rx="3" fill={LI} opacity=".5" />
    </svg>
  );
}
