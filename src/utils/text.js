export function slugify(s) {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function onlyDigits(s) {
  return String(s || "").replace(/\D/g, "");
}

export function truncate(s, n) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

/** Texto com quebras de linha -> parágrafos. */
export function paragraphs(s) {
  return String(s || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

export function lines(s) {
  return String(s || "").split("\n").map((p) => p.trim()).filter(Boolean);
}
