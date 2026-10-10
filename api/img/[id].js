// Entrega uma imagem guardada no Firestore (imageBlobs/{id}) como arquivo,
// com cache longo na CDN da Vercel (o id nunca muda de conteúdo).
const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || "taisefoto";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!/^[A-Za-z0-9]{10,40}$/.test(String(id || ""))) return res.status(400).end("id inválido");
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/imageBlobs/${id}`);
  if (r.status === 404) return res.status(404).end("não encontrada");
  if (!r.ok) return res.status(502).end("erro ao buscar imagem");
  const doc = await r.json();
  const data = doc.fields?.data?.stringValue;
  const type = doc.fields?.contentType?.stringValue || "image/webp";
  if (!data) return res.status(404).end("vazia");
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
  res.status(200).send(Buffer.from(data, "base64"));
}
