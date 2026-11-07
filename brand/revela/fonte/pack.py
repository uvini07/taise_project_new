import sys; sys.path.insert(0,'.')
from fontgen import *
OUT=sys.argv[1]; import os; os.makedirs(OUT+"/svg",exist_ok=True)
T="#1C1917"; A="#C8553D"; P="#F6F1EA"
def W(name, s): open(f"{OUT}/svg/{name}.svg","w").write(s)
for nm,ink,light in (("revela-logo",T,A),("revela-logo-negativo",P,A),("revela-logo-mono-preto",T,T),("revela-logo-mono-branco","#FFFFFF","#FFFFFF")):
    W(nm, wordmark_svg(ink=ink,light=light)[0])
# símbolo = o r
def r_svg(ink, light, bg=None, pad=0.0, rx=0, scale_dot=1.0):
    from pathops import Path
    sc=1.0
    bw=r_right; bh=X+O
    side=max(bw,bh)*(1+2*pad)
    ox=(side-bw)/2; oy=(side-bh)/2
    body=f'<path d="{to_svg_d(r_body,ox,oy+X+O,1)}" fill="{ink}"/><path d="{to_svg_d(r_dot,ox,oy+X+O,1)}" fill="{light}"/>'
    b=f'<rect width="{side:.0f}" height="{side:.0f}" rx="{side*rx:.0f}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side:.0f} {side:.0f}" role="img" aria-label="Revela"><title>Revela</title>{b}{body}</svg>'
W("revela-simbolo", r_svg(T,A))
W("revela-simbolo-negativo", r_svg(P,A))
W("revela-icone-app", r_svg(P,A,bg=T,pad=0.42,rx=0.225))
W("revela-favicon", r_svg(P,A,bg=T,pad=0.22,rx=0.225))
build_font(OUT+"/RevelaDisplay-Regular.otf")
