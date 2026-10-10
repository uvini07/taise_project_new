import { Link } from "react-router-dom";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";

export default function NotFound() {
  useDocumentMeta({ title: "Página não encontrada" });
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="display-lg mt-3">Esta página não existe</h1>
      <p className="mt-4 max-w-md text-ink-muted">O endereço pode ter mudado. Que tal voltar para o início?</p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-primary">Ir para o início</Link>
        <Link to="/galeria" className="btn-outline">Ver a galeria</Link>
      </div>
    </section>
  );
}
