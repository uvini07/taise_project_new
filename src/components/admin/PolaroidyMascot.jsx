// Mascote da Polaroidy (ideia 1, "Polaroid sorrindo"), nas cores da Revela.
// Os outros desenhos estão em brand/revela/polaroidy/; para trocar o mascote,
// é só substituir o desenho abaixo.
export default function PolaroidyMascot({ className = "h-8 w-8", blink = false }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <rect x="40" y="28" width="120" height="144" rx="16" fill="#F7F5FA" stroke="#2B2540" strokeWidth="6" />
      <rect x="54" y="42" width="92" height="88" rx="10" fill="#2B2540" />
      <g className={blink ? "origin-center animate-[polaroidy-blink_4s_ease-in-out_infinite]" : ""} style={{ transformBox: "fill-box" }}>
        <circle cx="84" cy="80" r="7" fill="#E6E1F0" />
        <circle cx="116" cy="80" r="7" fill="#E6E1F0" />
      </g>
      <path d="M86 102 Q100 115 114 102" fill="none" stroke="#E6E1F0" strokeWidth="5" strokeLinecap="round" />
      <circle cx="128" cy="56" r="6" fill="#C95D63" />
      <circle cx="74" cy="100" r="5" fill="#C95D63" opacity=".55" />
      <circle cx="126" cy="100" r="5" fill="#C95D63" opacity=".55" />
    </svg>
  );
}
