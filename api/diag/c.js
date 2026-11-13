import { adminDb } from "../../lib/admin.js";
export default function h(req, res) { res.status(200).json({ lib: typeof adminDb }); }
