import { useEffect } from "react";
import { SettingsProvider } from "../contexts/SettingsContext.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";

function setIcon(rel, href, sizes) {
  const sel = sizes ? `link[rel="${rel}"][sizes="${sizes}"]` : `link[rel="${rel}"]`;
  const el = document.head.querySelector(sel);
  if (el) el.href = href;
}

/**
 * O site do estúdio (/tarufino): configurações do estúdio + cabeçalho e rodapé.
 * Fica num arquivo próprio para a página da Revela não baixar o Firestore.
 */
export default function StudioShell() {
  // Quem chega da página da Revela sem recarregar volta a ver o ícone e a cor do estúdio.
  useEffect(() => {
    setIcon("icon", "/favicon-32.png", "32x32");
    setIcon("icon", "/favicon-192.png", "192x192");
    setIcon("apple-touch-icon", "/apple-touch-icon.png");
    document.head.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#3E060A");
  }, []);
  return (
    <SettingsProvider>
      <PublicLayout />
    </SettingsProvider>
  );
}
