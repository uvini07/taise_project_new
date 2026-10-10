import { createContext, useContext, useEffect, useState } from "react";
import { subscribeSettings } from "../services/settingsService.js";
import { mergeSettings } from "../config/defaults.js";

const SettingsContext = createContext({ settings: mergeSettings(null), loading: true });

export function SettingsProvider({ children }) {
  const [state, setState] = useState({ settings: mergeSettings(null), loading: true });
  useEffect(() => subscribeSettings((settings) => setState({ settings, loading: false })), []);
  return <SettingsContext.Provider value={state}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
