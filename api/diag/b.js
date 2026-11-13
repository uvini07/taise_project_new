import { PLANS } from "../../src/revela/data.js";
export default function h(req, res) { res.status(200).json({ plans: PLANS.length }); }
