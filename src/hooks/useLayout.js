import { useLocation } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext.jsx";
import { effectiveLayout } from "../config/siteStyle.js";

/** Modelo do site em uso (Clássico, Diagonal, Dividido, Arco ou Mosaico). */
export function useLayout() {
  const { settings } = useSettings();
  const { search } = useLocation();
  return effectiveLayout(settings.layout, search);
}
