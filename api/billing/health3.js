import { PLAN_KEYS } from "../_lib/stripe.js";
export default function handler(req, res) { res.status(200).json({ keys: Object.keys(PLAN_KEYS) }); }
