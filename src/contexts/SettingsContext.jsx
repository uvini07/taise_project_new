import { createContext, useContext, useEffect, useState } from "react";
import { cachedSettings, loadSettingsOnce, subscribeSettings } from "../services/settingsService.js";
import { mergeSettings } from "../config/defaults.js";
import { applyTheme } from "../utils/theme.js";
import { applyFonts } from "../config/siteStyle.js";
import { setContentVersion } from "../services/cache.js";
import { isEditorPreview } from "../utils/editorMode.js";

const SettingsContext = createContext({ settings: mergeSettings(null), loading: true });

export function SettingsProvider({ children }) {
  const [state, setState] = useState(() => {
    const c = cachedSettings();
    return { settings: c || mergeSettings(null), loading: true };
  });
  useEffect(() => {
    const done = (settings) => { setContentVersion(settings.contentVersion); setState({ settings, loading: false }); };
    // Painel: tempo real. Site: uma leitura por visita (o resto vem do cache).
    if (window.location.pathname.startsWith("/adm")) return subscribeSettings(done);
    loadSettingsOnce().then(done).catch(() => done(state.settings));
    if (!isEditorPreview()) return undefined;
    // Editor do site: o painel manda as alterações (ainda não salvas) e a
    // prévia mostra na hora.
    const onMsg = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== "revela:settings") return;
      setState({ settings: mergeSettings(e.data.settings), loading: false });
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "revela:ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMsg);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { applyTheme(state.settings.theme); }, [JSON.stringify(state.settings.theme)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { applyFonts(state.settings.fonts); }, [state.settings.fonts?.display, state.settings.fonts?.body]);
  return <SettingsContext.Provider value={state}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
