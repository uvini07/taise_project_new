import { createContext, useContext, useEffect, useState } from "react";
import { cachedSettings, loadSettingsOnce, subscribeSettings } from "../services/settingsService.js";
import { mergeSettings } from "../config/defaults.js";
import { applyTheme } from "../utils/theme.js";
import { setContentVersion } from "../services/cache.js";

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
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { applyTheme(state.settings.theme); }, [JSON.stringify(state.settings.theme)]); // eslint-disable-line react-hooks/exhaustive-deps
  return <SettingsContext.Provider value={state}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
