import { connectStorageEmulator, getStorage } from "firebase/storage";
import { app, useEmulators } from "./firebase.js";

export const storage = getStorage(app);

if (useEmulators && !globalThis.__TAISE_ST_EMU__) {
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  globalThis.__TAISE_ST_EMU__ = true;
}
