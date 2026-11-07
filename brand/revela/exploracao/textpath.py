"""Converte texto em contornos SVG (com kerning via HarfBuzz) e tracking extra."""
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import io

def load(path):
    f = TTFont(path)
    buf = io.BytesIO(); f.flavor = None; f.save(buf)
    return f, buf.getvalue()

def text_path(path, text, size, x=0, y=0, tracking=0.0, feats=None):
    """tracking em em (ex.: 0.02). y = linha de base. Retorna (d, largura, bbox)."""
    font, data = load(path)
    upem = font["head"].unitsPerEm
    face = hb.Face(data); hbf = hb.Font(face)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(hbf, buf, feats or {"kern": True, "liga": True})
    gs = font.getGlyphSet(); order = font.getGlyphOrder()
    s = size / upem
    pen = SVGPathPen(gs, lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    bp = BoundsPen(gs)
    cx = 0
    n = len(buf.glyph_infos)
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        g = order[info.codepoint]
        t = (s, 0, 0, -s, x + (cx + pos.x_offset) * s, y - pos.y_offset * s)
        gs[g].draw(TransformPen(pen, t)); gs[g].draw(TransformPen(bp, t))
        cx += pos.x_advance + (tracking * upem if i < n - 1 else 0)
    return pen.getCommands(), cx * s, bp.bounds

def metrics(path):
    font, _ = load(path)
    os2 = font["OS/2"]; upem = font["head"].unitsPerEm
    return {"upem": upem, "xh": getattr(os2, "sxHeight", 0), "cap": getattr(os2, "sCapHeight", 0)}
