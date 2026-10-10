import { useState } from "react";

/**
 * Imagem com carregamento progressivo: mostra o mini placeholder desfocado
 * (gravado no banco no upload) e troca pela foto quando ela termina de baixar.
 * Usa a miniatura em telas pequenas e a versão maior só quando necessário.
 */
export default function SmartImage({
  src, thumb, placeholder, alt = "", width, height, sizes = "100vw", className = "", imgClassName = "",
  priority = false, style,
}) {
  const [loaded, setLoaded] = useState(false);
  const srcSet = thumb && thumb !== src ? `${thumb} 720w, ${src} 2048w` : undefined;
  return (
    <div className={`relative overflow-hidden bg-sand/50 ${className}`} style={style}>
      {placeholder && !loaded && (
        <img src={placeholder} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl" />
      )}
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchpriority={priority ? "high" : undefined}
        onLoad={() => setLoaded(true)}
        data-loaded={loaded}
        className={`smart-img relative h-full w-full object-cover ${imgClassName}`}
      />
    </div>
  );
}
