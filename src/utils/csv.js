// CSV no formato que o Excel brasileiro abre direto (separador ";" e BOM).
export function toCSV(rows, columns) {
  const esc = (v) => {
    if (v == null) return "";
    const s = String(v);
    // Evita que planilhas interpretem o conteúdo como fórmula.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const head = columns.map((c) => esc(c.label)).join(";");
  const body = rows.map((r) => columns.map((c) => esc(c.value(r))).join(";")).join("\r\n");
  return "﻿" + head + "\r\n" + body;
}

export function downloadCSV(filename, rows, columns) {
  const blob = new Blob([toCSV(rows, columns)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
