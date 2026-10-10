import { createContext, useContext, useEffect, useState } from "react";
import { watchAdminSession } from "../services/authService.js";

const AuthContext = createContext({ status: "loading", user: null, admin: null });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", user: null, admin: null });
  useEffect(() => watchAdminSession(setState), []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
