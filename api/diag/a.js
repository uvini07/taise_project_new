import { getAuth } from "firebase-admin/auth";
export default function h(req, res) { res.status(200).json({ auth: typeof getAuth }); }
