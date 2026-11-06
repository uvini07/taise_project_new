// Embaralhamento das prévias: a imagem é cortada em blocos e gravada com os
// blocos fora de ordem. Quem baixar o arquivo (salvar imagem, aba Rede do
// navegador) recebe um quebra-cabeça; a página monta a foto certa num canvas.
// Os blocos têm lado múltiplo de 16 px para alinhar com os blocos de
// compressão do WebP/JPEG e não deixar emendas visíveis.

const ALIGN = 16;

function shuffle(n, rand) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Garante que nenhum bloco fique no lugar original.
  if (n > 1) for (let i = 0; i < n; i++) if (a[i] === i) { const k = (i + 1) % n; [a[i], a[k]] = [a[k], a[i]]; }
  return a;
}

/**
 * Plano de embaralhamento para uma imagem width×height em cols×rows blocos.
 * A foto montada fica com cols*tileW × rows*tileH (corta poucos pixels da borda).
 * No arquivo, cada bloco ocupa uma "vaga" com `pad` pixels de margem (com o
 * conteúdo vizinho), para a compressão não borrar a emenda ao remontar.
 * perm[i] = bloco original que vai na vaga i do arquivo embaralhado.
 */
export function scramblePlan(width, height, cols, rows, rand = Math.random, pad = 8) {
  const fit = (size, parts) => {
    const raw = Math.floor(size / parts);
    return raw >= ALIGN ? raw - (raw % ALIGN) : Math.max(1, raw);
  };
  const tileW = fit(width, cols);
  const tileH = fit(height, rows);
  return {
    cols, rows, tileW, tileH, pad,
    width: tileW * cols, height: tileH * rows,
    fileWidth: (tileW + 2 * pad) * cols, fileHeight: (tileH + 2 * pad) * rows,
    perm: shuffle(cols * rows, rand),
  };
}

/**
 * Retângulos {x, y, w, h} de cada bloco.
 * "scramble": da foto (bloco + margem, limitado à borda da foto) para a vaga no arquivo.
 * "unscramble": do miolo da vaga no arquivo para o lugar certo na foto.
 */
export function scrambleMoves(plan, direction = "unscramble") {
  const { cols, tileW, tileH, perm, width, height } = plan;
  const pad = plan.pad || 0;
  const slotW = tileW + 2 * pad, slotH = tileH + 2 * pad;
  return perm.map((orig, pos) => {
    const slot = { x: (pos % cols) * slotW, y: Math.floor(pos / cols) * slotH };
    const real = { x: (orig % cols) * tileW, y: Math.floor(orig / cols) * tileH };
    if (direction === "unscramble") {
      return { from: { x: slot.x + pad, y: slot.y + pad, w: tileW, h: tileH }, to: { x: real.x, y: real.y, w: tileW, h: tileH } };
    }
    const x0 = Math.max(0, real.x - pad), y0 = Math.max(0, real.y - pad);
    const x1 = Math.min(width, real.x + tileW + pad), y1 = Math.min(height, real.y + tileH + pad);
    const w = x1 - x0, h = y1 - y0;
    return { from: { x: x0, y: y0, w, h }, to: { x: slot.x + pad - (real.x - x0), y: slot.y + pad - (real.y - y0), w, h } };
  });
}
