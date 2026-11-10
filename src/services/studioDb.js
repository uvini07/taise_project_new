// Caminhos do banco por estúdio. A Taíse (estúdio original) usa as coleções da
// raiz; cada novo estúdio tem as suas dentro de studios/{slug}/.
import { collection, doc } from "firebase/firestore";
import { db } from "./firebase.js";
import { currentStudio, isLegacyStudio } from "../config/tenant.js";

const prefix = () => (isLegacyStudio() ? [] : ["studios", currentStudio()]);

/** sCol("packages") → coleção de pacotes do estúdio aberto. */
export const sCol = (name, ...rest) => collection(db, ...prefix(), name, ...rest);
/** sDoc("packages", id) → documento do estúdio aberto. */
export const sDoc = (name, ...rest) => doc(db, ...prefix(), name, ...rest);
