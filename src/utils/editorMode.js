// Prévia dentro do Editor do site: o site do estúdio roda num iframe com este
// nome. O nome da janela continua ao navegar entre as páginas da prévia.
export const EDITOR_FRAME = "revela-editor";

export function isEditorPreview() {
  try { return typeof window !== "undefined" && window.self !== window.top && window.name === EDITOR_FRAME; } catch { return false; }
}
