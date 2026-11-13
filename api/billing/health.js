// Diagnóstico temporário (sem segredos).
import Stripe from "stripe";
export default function handler(req, res) { res.status(200).json({ stripe: typeof Stripe }); }
