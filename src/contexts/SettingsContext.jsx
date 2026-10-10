import { createContext, useContext, useEffect, useState } from "react";
import { subscribeSettings } from "../services/settingsService.js";
import { mergeSettings } from "../config/defaults.js";
import { applyTheme } from "../utils/theme.js";

const SettingsContext = createContext({ settings: mergeSettings(null), loading: true });

export function SettingsProvider({ children }) {
  const [state, setState] = useState({ settings: mergeSettings(null), loading: true });
  useEffect(() => subscribeSettings((settings) => setState({ settings, loading: false })), []);
  useEffect(() => { applyTheme(state.settings.theme); }, [state.settings.theme?.primary, state.settings.theme?.background]); // eslint-disable-line react-hooks/exhaustive-deps
  return <SettingsContext.Provider value={state}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
