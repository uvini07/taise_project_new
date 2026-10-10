// Ícones de marcas desenhados à mão (traço fino, combinando com o Lucide).
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };

export const WhatsAppIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M3.5 20.5 4.8 16A8.5 8.5 0 1 1 8 19.2Z" />
    <path d="M9 8.6c.2-.5.5-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .5-.1.6l-.5.6c-.1.2-.2.4 0 .6.6 1 1.4 1.8 2.4 2.4.2.1.4.1.6 0l.6-.5c.2-.2.4-.2.6-.1l1.7.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.6.8-.6.3-1.6.5-3.2-.3a9.6 9.6 0 0 1-4.1-4.1c-.8-1.6-.6-2.6-.3-3.2Z" fill="currentColor" stroke="none" />
  </svg>
);

export const InstagramIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" />
  </svg>
);

export const FacebookIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M14 8h2.5V4.5H14A3.5 3.5 0 0 0 10.5 8v2.5H8V14h2.5v6.5H14V14h2.5l.5-3.5h-3V8Z" />
  </svg>
);

export const TikTokIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 3c.4 2.6 2.2 4.4 5 4.7" />
  </svg>
);

export const YoutubeIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="m10.5 9.5 4 2.5-4 2.5Z" fill="currentColor" />
  </svg>
);

export const PinterestIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10.5 21 2-8.5M10 13.5c-.6-2.6.6-5 3-5 2 0 3 1.5 2.6 3.5-.4 2-1.8 3.4-3.3 3" />
  </svg>
);
