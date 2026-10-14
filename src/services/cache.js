// Cache das leituras públicas para economizar o Firestore.
//
// Cada resultado fica na memória (durante a visita) e no localStorage (entre
// visitas). A chave inclui a "versão do conteúdo" (siteSettings.contentVersion),
// que o painel incrementa a cada alteração: enquanto nada muda no painel, o
// visitante que volta ao site não gasta leitura nenhuma com pacotes, galeria,
// categorias, campanhas e agenda — só com o documento de configurações.

const PREFIX = "tf-cache:";
const mem = new Map();
let currentVersion = "0";

export function setContentVersion(v) {
  const next = String(v ?? "0");
  if (next === currentVersion) return;
  currentVersion = next;
  mem.clear();
  // Remove entradas de versões antigas para não lotar o armazenamento.
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX) && !k.startsWith(`${PREFIX}${next}:`)) localStorage.removeItem(k);
    }
  } catch { /* sem armazenamento */ }
}

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* cheio ou bloqueado */ } };

/**
 * cached("pacotes", fn, { ttl }) — devolve o valor guardado se ainda válido;
 * senão busca, guarda e devolve. ttl em ms (padrão 24 h; a versão invalida antes).
 */
export function cached(name, fn, { ttl = 24 * 3600 * 1000, persist = true } = {}) {
  const key = `${PREFIX}${currentVersion}:${name}`;
  const m = mem.get(key);
  if (m && Date.now() - m.at < ttl) return m.promise;
  if (persist) {
    const saved = read(key);
    if (saved && Date.now() - saved.at < ttl) {
      const promise = Promise.resolve(saved.value);
      mem.set(key, { at: saved.at, promise });
      return promise;
    }
  }
  const at = Date.now();
  const promise = fn().then((value) => { if (persist) write(key, { at, value }); return value; });
  promise.catch(() => mem.delete(key));
  mem.set(key, { at, promise });
  return promise;
}

export function getContentVersion() { return currentVersion; }
