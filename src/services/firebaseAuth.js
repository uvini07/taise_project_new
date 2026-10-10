import { connectAuthEmulator, getAuth } from "firebase/auth";
import { app, useEmulators } from "./firebase.js";

export const auth = getAuth(app);
auth.languageCode = "pt-BR";

if (useEmulators && !globalThis.__TAISE_AUTH_EMU__) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  globalThis.__TAISE_AUTH_EMU__ = true;
}
