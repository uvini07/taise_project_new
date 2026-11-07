"""Revela Display: letras r, e, v, l, a construídas com φ. Unidades: em = 1000, altura de x X = 500."""
import math, sys, os
import pathops
from pathops import Path, PathOp, op
PHI=(1+5**.5)/2
X=500.0                 # altura de x
S=X/PHI**3.6            # haste grossa  (≈ 88)
TH=S/PHI                # traço fino     (≈ 45)
O=X*0.015               # compensação ótica das curvas (overshoot)
ASC=X*(1+1/PHI**2)      # ascendente do l = X·(1+1/φ²) (≈ 691)
K=0.5522847498

def ellipse(cx,cy,rx,ry):
    p=Path(); p.moveTo(cx+rx,cy)
    p.cubicTo(cx+rx,cy+ry*K,cx+rx*K,cy+ry,cx,cy+ry)
    p.cubicTo(cx-rx*K,cy+ry,cx-rx,cy+ry*K,cx-rx,cy)
    p.cubicTo(cx-rx,cy-ry*K,cx-rx*K,cy-ry,cx,cy-ry)
    p.cubicTo(cx+rx*K,cy-ry,cx+rx,cy-ry*K,cx+rx,cy)
    p.close(); return p
def poly(pts):
    p=Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    p.close(); return p
def rect(x0,y0,x1,y1): return poly([(x0,y0),(x1,y0),(x1,y1),(x0,y1)])
def U(*ps):
    r=ps[0]
    for p in ps[1:]: r=op(r,p,PathOp.UNION)
    return r
def D(a,b): return op(a,b,PathOp.DIFFERENCE)
def ring(cx,cy,rx,ry,side,top):
    return D(ellipse(cx,cy,rx,ry), ellipse(cx,cy,rx-side,ry-top))

G={}   # nome -> (path, avanço, extra)

# ---------- r (a mesma espiral do símbolo, em altura de x) ----------
def spiral_r(turns=1.25):
    R=X/PHI**2            # altura total = R·φ² = X
    s=S                   # mesma haste das outras letras
    x0=s/2; ytop=X+O      # topo (y para cima)
    cy0=ytop-s/2-R        # centro do 1º arco
    # quartos de círculo: começa na haste (x0, cy0), sobe para a direita
    pts=[]; x,y,r=x0,cy0,R
    arcs=[]
    for i in range(math.ceil(turns)):
        k=i%4
        if k==0: cx,cy=x+r,y; a0,a1=math.pi, math.pi/2
        if k==1: cx,cy=x,y-r; a0,a1=math.pi/2, 0
        if k==2: cx,cy=x-r,y; a0,a1=0,-math.pi/2
        frac=min(1,turns-i); a1=a0+(a1-a0)*frac
        N=max(3,int(40*frac))
        for j in range(N+1):
            t=j/N; a=a0+(a1-a0)*t; w=s/PHI**(0.5*(i+t*frac))
            pts.append((cx+r*math.cos(a),cy+r*math.sin(a),math.cos(a),math.sin(a),w))
        ex,ey=cx+r*math.cos(a1 if frac==1 else a1),cy+r*math.sin(a1)
        if k==0: x,y=x+r,y+r
        if k==1: x,y=x+r,y-r
        r=r/PHI
    outer=[(p[0]+p[2]*p[4]/2,p[1]+p[3]*p[4]/2) for p in pts]
    inner=[(p[0]-p[2]*p[4]/2,p[1]-p[3]*p[4]/2) for p in pts]
    body=poly([(x0-s/2,0),(x0-s/2,cy0)]+outer+list(reversed(inner))+[(x0+s/2,cy0),(x0+s/2,0)])
    tx,ty,_,_,tw=pts[-1]
    body=U(body,ellipse(tx,ty,tw/2,tw/2))
    # luz: logo abaixo da ponta, no mesmo eixo; raio = haste/φ·0,9, respiro = traço fino
    dot_r=s/PHI*0.9
    xs=tx; ys=ty-tw/2-TH*0.9-dot_r
    dot=ellipse(xs,ys,dot_r,dot_r)
    right=max(max(p[0] for p in outer), xs+dot_r)
    return body,dot,right
r_body,r_dot,r_right=spiral_r()

# ---------- e ----------
def glyph_e():
    w=X*0.96; cx=w/2; cy=X/2
    rg=ring(cx,cy,w/2,X/2+O,S,TH)
    bar_top=X*0.5+TH*0.75             # barra logo acima do meio (equilíbrio ótico)
    bar=rect(S*0.5,bar_top-TH,w-S*0.5,bar_top)
    e=U(rg,bar)
    # abertura: corta o quadrante inferior direito abaixo da barra
    gap=TH*1.1
    cut=poly([(cx+w*0.02,bar_top-TH-gap*0.4),(w+40,bar_top-TH-gap*0.4),(w+40,X*0.22),(cx+w*0.30,X*0.22)])
    return D(e,cut), w
# ---------- v ----------
def glyph_v():
    w=X*0.92; b=TH*0.42; sl=S*1.12; st=TH*1.12
    left=poly([(0,X),(sl,X),(w/2+b,0),(w/2-b,0)])
    right=poly([(w-st,X),(w,X),(w/2+b,0),(w/2-b,0)])
    return U(left,right), w
# ---------- l ----------
def glyph_l():
    return rect(0,0,S,ASC), S
# ---------- a (um andar, geométrico) ----------
def glyph_a():
    w=X*0.92; cx=(w-S*0.5)/2
    bowl=ring(cx,X/2,(w-S*0.5)/2,X/2+O,S,TH)
    stem=rect(w-S,0,w,X+O*0.3)
    return U(D(bowl,rect(w-S,-50,w+50,X+50)),stem), w

G["e"]=glyph_e(); G["v"]=glyph_v(); G["l"]=glyph_l(); G["a"]=glyph_a()
G["r"]=(U(r_body,r_dot), r_right)

# espaçamento: lados retos, redondos e diagonais (múltiplos de S)
SB={"r":(S*0.75, S*0.05), "e":(S*0.42,S*0.40), "v":(S*0.12,S*0.12), "l":(S*0.75,S*0.75), "a":(S*0.42,S*0.75)}

def to_svg_d(path, dx=0, base=0, scale=1.0):
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    pen=SVGPathPen(None, lambda v: f"{v:.2f}")
    path.draw(TransformPen(pen,(scale,0,0,-scale,dx,base)))
    return pen.getCommands()

def wordmark_svg(text="revela", scale=0.2, ink="#1C1917", light="#C8553D", track=0.0):
    x=0; body=""
    for ch in text:
        lsb,rsb=SB[ch]
        x+=lsb*scale
        if ch=="r":
            body+=f'<path d="{to_svg_d(r_body,x,ASC*scale,scale)}" fill="{ink}"/><path d="{to_svg_d(r_dot,x,ASC*scale,scale)}" fill="{light}"/>'
        else:
            body+=f'<path d="{to_svg_d(G[ch][0],x,ASC*scale,scale)}" fill="{ink}"/>'
        x+=G[ch][1]*scale+rsb*scale+track*scale
    H=(ASC+O)*scale
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {-O*scale:.1f} {x:.1f} {H+O*scale:.1f}" role="img" aria-label="revela"><title>revela</title>{body}</svg>', x, H

def build_font(path):
    from fontTools.fontBuilder import FontBuilder
    from fontTools.pens.t2CharStringPen import T2CharStringPen
    order=[".notdef","space","r","e","v","l","a"]
    fb=FontBuilder(1000,isTTF=False); fb.setupGlyphOrder(order)
    fb.setupCharacterMap({32:"space",ord("r"):"r",ord("e"):"e",ord("v"):"v",ord("l"):"l",ord("a"):"a"})
    cs={}; adv={}
    for g in order:
        pen=T2CharStringPen(0,None)
        if g in G:
            lsb,rsb=SB[g]
            from fontTools.pens.transformPen import TransformPen
            G[g][0].draw(TransformPen(pen,(1,0,0,1,lsb,0)))
            adv[g]=round(lsb+G[g][1]+rsb)
        else:
            adv[g]=round(X*0.5) if g=="space" else 500
        cs[g]=pen.getCharString()
    fb.setupCFF("RevelaDisplay-Regular",{"FullName":"Revela Display Regular"},cs,{})
    fb.setupHorizontalMetrics({g:(adv[g],0) for g in order})
    fb.setupHorizontalHeader(ascent=900,descent=-200)
    fb.setupNameTable({"familyName":"Revela Display","styleName":"Regular"})
    fb.setupOS2(sTypoAscender=900,sTypoDescender=-200,usWinAscent=900,usWinDescent=200,sxHeight=round(X),sCapHeight=round(ASC))
    fb.setupPost(); fb.save(path)

if __name__=="__main__":
    out=sys.argv[1]
    svg,w,h=wordmark_svg(); open(out+"/wordmark.svg","w").write(svg)
    svgd,_,_=wordmark_svg(ink="#F6F1EA"); open(out+"/wordmark-neg.svg","w").write(svgd)
    build_font(out+"/RevelaDisplay-Regular.otf")
    print("S",round(S,1),"TH",round(TH,1),"ASC",round(ASC,1))
