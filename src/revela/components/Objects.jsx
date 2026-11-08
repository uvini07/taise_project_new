import { forwardRef, useId } from "react";

/* Objetos de fotografia em vidro, desenhados em SVG nas cores da Revela. */

export const Camera = forwardRef(function Camera({ className = "", style }, ref) {
  const id = useId().replace(/:/g, "");
  return (
    <svg ref={ref} viewBox="0 0 280 200" className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset=".55" stopColor="#E6E1F0" stopOpacity=".55" />
          <stop offset="1" stopColor="#C9C1DE" stopOpacity=".5" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#E6E1F0" stopOpacity=".6" />
        </linearGradient>
        <radialGradient id={`${id}l`} cx=".38" cy=".32" r=".8">
          <stop offset="0" stopColor="#8E86A6" />
          <stop offset=".45" stopColor="#3A3354" />
          <stop offset="1" stopColor="#1C1830" />
        </radialGradient>
        <radialGradient id={`${id}g`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#C95D63" stopOpacity=".95" />
          <stop offset="1" stopColor="#C95D63" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}s`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#2B2540" floodOpacity=".28" />
        </filter>
      </defs>
      <g filter={`url(#${id}s)`}>
        <rect x="44" y="20" width="74" height="34" rx="12" fill={`url(#${id}t)`} stroke="#fff" strokeOpacity=".9" strokeWidth="1.5" />
        <rect x="196" y="28" width="40" height="20" rx="8" fill={`url(#${id}t)`} stroke="#fff" strokeWidth="1.2" />
        <rect x="14" y="44" width="252" height="136" rx="30" fill={`url(#${id}b)`} stroke="#fff" strokeWidth="1.6" />
        <rect x="14" y="44" width="252" height="40" rx="30" fill="#fff" fillOpacity=".28" />
        <path d="M44 62h70" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        <rect x="200" y="62" width="44" height="22" rx="7" fill="#fff" fillOpacity=".85" stroke="#DDD8E8" />
        <circle cx="140" cy="112" r="58" fill="#2B2540" opacity=".92" />
        <circle cx="140" cy="112" r="50" fill="none" stroke="#8E86A6" strokeOpacity=".7" strokeWidth="2" strokeDasharray="2 5" />
        <circle cx="140" cy="112" r="42" fill={`url(#${id}l)`} />
        <circle cx="140" cy="112" r="24" fill="#1C1830" />
        <circle cx="140" cy="112" r="30" fill={`url(#${id}g)`} opacity=".55" />
        <path d="M112 92a40 40 0 0 1 30-18" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".75" fill="none" />
        <circle cx="157" cy="96" r="5" fill="#fff" opacity=".85" />
        <circle cx="228" cy="38" r="0" />
        <circle cx="62" cy="150" r="6" fill="#C95D63" />
      </g>
    </svg>
  );
});

/**
 * Lente com diafragma de 6 lâminas. A abertura (r) e o giro (twist) são
 * animados pelo GSAP nos elementos [data-blade] e [data-blade-inner].
 */
export const Aperture = forwardRef(function Aperture({ className = "", style, open = 26 }, ref) {
  const id = useId().replace(/:/g, "");
  const blades = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <svg ref={ref} viewBox="0 0 220 220" className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}ring`} cx=".35" cy=".3" r=".9">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".5" stopColor="#E6E1F0" stopOpacity=".7" />
          <stop offset="1" stopColor="#B9B0D2" stopOpacity=".7" />
        </radialGradient>
        <radialGradient id={`${id}hole`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#FFE9EA" />
          <stop offset=".35" stopColor="#C95D63" />
          <stop offset="1" stopColor="#2B2540" />
        </radialGradient>
        <linearGradient id={`${id}blade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4A4360" />
          <stop offset="1" stopColor="#2B2540" />
        </linearGradient>
        <clipPath id={`${id}clip`}><circle cx="110" cy="110" r="74" /></clipPath>
        <filter id={`${id}s`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#2B2540" floodOpacity=".3" />
        </filter>
      </defs>
      <g filter={`url(#${id}s)`}>
        <circle cx="110" cy="110" r="102" fill={`url(#${id}ring)`} stroke="#fff" strokeWidth="1.6" />
        <circle cx="110" cy="110" r="88" fill="none" stroke="#8E86A6" strokeOpacity=".45" strokeDasharray="1.5 6" strokeWidth="6" />
        <circle cx="110" cy="110" r="76" fill="#1C1830" />
        <g clipPath={`url(#${id}clip)`}>
          <circle cx="110" cy="110" r="74" fill={`url(#${id}hole)`} />
          {blades.map((a) => (
            <g key={a} data-blade transform={`rotate(${a} 110 110)`}>
              {/* Cada lâmina cobre o semiplano além da distância "open" do centro: juntas, deixam um hexágono aberto. */}
              <path data-blade-inner d="M -40 0 L 260 0 L 260 -200 L -40 -200 Z" fill={`url(#${id}blade)`} stroke="#8E86A6" strokeOpacity=".55" strokeWidth="1.2"
                transform={`translate(0 ${110 - open})`} />
            </g>
          ))}
        </g>
        <path d="M54 70a74 74 0 0 1 56-34" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".7" fill="none" />
      </g>
    </svg>
  );
});

/** Polaroide com foto (a parte de baixo fica em branco, como no papel). */
export const Polaroid = forwardRef(function Polaroid({ src, className = "", style, alt = "" }, ref) {
  return (
    <div ref={ref} className={`rounded-[6px] bg-white p-2.5 pb-9 shadow-[0_24px_50px_-22px_rgba(43,37,64,.55),inset_0_1px_0_#fff] ring-1 ring-rv-linha ${className}`} style={style}>
      <div className="relative aspect-square overflow-hidden rounded-[2px] bg-rv-lavanda">
        <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" draggable="false" />
        <span className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" aria-hidden />
      </div>
    </div>
  );
});

/** Tira de filme com três fotos. */
export const FilmStrip = forwardRef(function FilmStrip({ photos = [], className = "", style }, ref) {
  const id = useId().replace(/:/g, "");
  return (
    <svg ref={ref} viewBox="0 0 330 120" className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <filter id={`${id}s`} x="-10%" y="-20%" width="120%" height="170%">
          <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#2B2540" floodOpacity=".3" />
        </filter>
        {photos.slice(0, 3).map((_, i) => (
          <clipPath key={i} id={`${id}c${i}`}><rect x={18 + i * 100} y="22" width="94" height="76" rx="4" /></clipPath>
        ))}
      </defs>
      <g filter={`url(#${id}s)`}>
        <rect x="6" y="6" width="318" height="108" rx="10" fill="#2B2540" />
        {Array.from({ length: 16 }, (_, i) => (
          <g key={i}>
            <rect x={14 + i * 19.6} y="11" width="9" height="6" rx="1.5" fill="#E6E1F0" opacity=".75" />
            <rect x={14 + i * 19.6} y="103" width="9" height="6" rx="1.5" fill="#E6E1F0" opacity=".75" />
          </g>
        ))}
        {photos.slice(0, 3).map((src, i) => (
          <image key={src} href={src} x={18 + i * 100} y="22" width="94" height="76" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}c${i})`} />
        ))}
      </g>
    </svg>
  );
});
