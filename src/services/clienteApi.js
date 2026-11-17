// Chamadas das páginas do CLIENTE (sem login), com a senha de acesso.
const key = (id) => `revela-pass-${id}`;
export function savedPass(id) { try { return sessionStorage.getItem(key(id)) || ""; } catch { return ""; } }
export function savePass(id, p) { try { if (p) sessionStorage.setItem(key(id), p); else sessionStorage.removeItem(key(id)); } catch { /* sem storage */ } }

export async function clienteApi(body) {
  const r = await fetch("/api/fotos/cliente", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(d.error || "Não foi possível abrir esta página.");
    err.needPassword = !!d.needPassword;
    throw err;
  }
  return d;
}
