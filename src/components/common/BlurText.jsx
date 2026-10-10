/**
 * Título que aparece palavra por palavra saindo do desfoque. Inspirado no
 * padrão "Blur Text" (React Bits), refeito em CSS puro: sem dependência e
 * respeitando a preferência de reduzir movimento.
 */
export default function BlurText({ text, as: Tag = "h1", className = "", delay = 0, step = 70 }) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} aria-hidden className="inline-block animate-blur-in" style={{ animationDelay: `${delay + i * step}ms` }}>
          {w}{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
