import SmartImage from "../common/SmartImage.jsx";

/** Grade em colunas (estilo masonry) que respeita a proporção de cada foto. */
export default function MasonryGrid({ photos, onOpen, columns = "columns-2 md:columns-3 lg:columns-4" }) {
  return (
    <div className={`${columns} gap-3 sm:gap-4 [column-fill:_balance]`}>
      {photos.map((p, i) => (
        <button key={p.id} type="button" onClick={() => onOpen(i)}
          className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl sm:mb-4"
          aria-label={`Ampliar foto${p.title ? `: ${p.title}` : ""}`}>
          <SmartImage
            src={p.url}
            thumb={p.thumbUrl}
            placeholder={p.placeholder}
            alt={p.alt || p.title || ""}
            width={p.width}
            height={p.height}
            sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
            style={{ aspectRatio: p.width && p.height ? `${p.width} / ${p.height}` : "4 / 5" }}
            imgClassName="transition-transform duration-[1.2s] ease-soft group-hover:scale-[1.035]"
          />
        </button>
      ))}
    </div>
  );
}
