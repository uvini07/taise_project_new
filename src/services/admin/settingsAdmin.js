import { increment, serverTimestamp, setDoc } from "firebase/firestore";
import { settingsRef } from "../settingsService.js";
import { audit } from "../auditService.js";

export async function saveSettings(data) {
  const { isDefault, contentVersion, ...rest } = data;
  await setDoc(settingsRef(), { ...rest, contentVersion: increment(1), updatedAt: serverTimestamp() }, { merge: true });
  audit("settings.update", "siteSettings", "public");
}
