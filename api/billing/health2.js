import { getApps } from "firebase-admin/app";
import { FieldValue } from "firebase-admin/firestore";
export default function handler(req, res) { res.status(200).json({ admin: typeof getApps, fv: typeof FieldValue }); }
