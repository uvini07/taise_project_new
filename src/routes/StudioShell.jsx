import { lazy, Suspense, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase.js";
import { isLegacyStudio } from "../config/tenant.js";
import PageLoader from "../components/common/PageLoader.jsx";

const RevelaNotFound = lazy(() => import("../revela/pages/RevelaNotFound.jsx"));
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
export default function StudioShell({ studio }) {
  const legacy = isLegacyStudio(studio);
  // Estúdios novos: confere se o endereço existe (1 leitura por visita).
  const [exists, setExists] = useState(legacy ? true : null);
  useEffect(() => {
    if (legacy) return;
    getDoc(doc(db, "studios", studio)).then((s) => setExists(s.exists())).catch(() => setExists(true));
  }, [studio, legacy]);
  // Quem chega da página da Revela sem recarregar volta a ver o ícone e a cor do estúdio.
  useEffect(() => {
    if (!legacy) return;
    setIcon("icon", "/favicon-32.png", "32x32");
    setIcon("icon", "/favicon-192.png", "192x192");
    setIcon("apple-touch-icon", "/apple-touch-icon.png");
    document.head.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#3E060A");
  }, [legacy]);
  if (exists === null) return <PageLoader full />;
  if (!exists) return <Suspense fallback={<PageLoader full />}><RevelaNotFound /></Suspense>;
  return (
    <SettingsProvider>
      <PublicLayout />
    </SettingsProvider>
  );
}
