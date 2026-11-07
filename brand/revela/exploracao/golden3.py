import sys, glob, math; sys.path.insert(0,'.')
from golden import *
from textpath import text_path
SERIF=glob.glob("../fonts/fontsource-fraunces-*/files/fraunces-latin-400-normal.woff")[0]

def sym(R=40, narcs=3, s0=1/PHI**2, k=PHI, dot=1/PHI**4, f=T, l=A, guides=False, uid="x"):
    """Haste com espessura s0·R; cada quarto de espiral divide a espessura por k.
    Desenhado como contorno preenchido (offset variável) para a transição ser contínua."""
    s = R*s0; x0 = s/2; y0 = s/2 + R; H = R*PHI*PHI
    arcs, squares = spiral_arcs(x0, y0, R, narcs)
    # amostra a espiral (centro do traço) com espessura variando continuamente
    pts=[]
    for i,(sx,sy,e1,e2,r,cx,cy) in enumerate(arcs):
        a0=math.atan2(sy-cy,sx-cx); a1=math.atan2(e2-cy,e1-cx)
        if a1 < a0: a1 += 2*math.pi
        for j in range(24 if i<narcs-1 else 25):
            t=j/24; a=a0+(a1-a0)*t
            w = s / k**(i+t)
            px,py=cx+r*math.cos(a),cy+r*math.sin(a)
            nx,ny=math.cos(a),math.sin(a)   # normal radial
            pts.append((px,py,nx,ny,w))
    outer=[(p[0]+p[2]*p[4]/2,p[1]+p[3]*p[4]/2) for p in pts]
    inner=[(p[0]-p[2]*p[4]/2,p[1]-p[3]*p[4]/2) for p in pts]
    bottom=s/2+H
    d=f"M{x0-s/2:.2f} {bottom:.2f}V{y0:.2f}"
    d+="".join(f"L{x:.2f} {y:.2f}" for x,y in outer)
    # ponta arredondada
    ex_,ey_,_,_,we=pts[-1]
    d+="".join(f"L{x:.2f} {y:.2f}" for x,y in reversed(inner))
    d+=f"L{x0+s/2:.2f} {y0:.2f}V{bottom:.2f}Z"
    out=""
    if guides:
        for (x,y,r) in squares: out+=f'<rect x="{x:.2f}" y="{y:.2f}" width="{r:.2f}" height="{r:.2f}" fill="none" stroke="{G}" stroke-width=".35"/>'
        for (_,_,_,_,r,cx,cy) in arcs: out+=f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="none" stroke="{G}" stroke-width=".25" stroke-dasharray="1 1.2"/>'
        out+=f'<rect x="{x0:.2f}" y="{s/2:.2f}" width="{R*PHI:.2f}" height="{H:.2f}" fill="none" stroke="{G}" stroke-width=".6"/>'
    out+=f'<path d="{d}" fill="{f}"/><circle cx="{ex_:.2f}" cy="{ey_:.2f}" r="{we/2:.2f}" fill="{f}"/>'
    ex,ey=eye(x0,y0,R)
    out+=f'<circle cx="{ex:.2f}" cy="{ey:.2f}" r="{R*dot:.2f}" fill="{l}"/>'
    if guides: out+=f'<circle cx="{ex:.2f}" cy="{ey:.2f}" r=".9" fill="{G}"/>'
    xs=[p[0] for p in outer]+[0]; ys=[p[1] for p in outer]
    return out, (0, min(ys), max(xs)+1, bottom)

VARS={
 "H1 · Afina ÷φ por volta (contraste da Fraunces)": dict(k=PHI),
 "H2 · Afina ÷√φ por volta (mais uniforme)": dict(k=PHI**.5),
 "H3 · Afina ÷φ, 2½ voltas, luz R/φ³·⁵": dict(k=PHI, narcs=3, dot=1/PHI**3.5),
}
wd,ww,wb=text_path(SERIF,"revela",100,0,0,-0.005)
_,_,lb=text_path(SERIF,"l",100); ASC=-lb[1]
_,_,eb=text_path(SERIF,"e",100); XH=-eb[1]
cells=""; y=20
for name,kw in VARS.items():
    g,bb=sym(guides=True,**kw); gp,_=sym(**kw); gd,_=sym(f=P,**kw)
    h=bb[3]-bb[1]; w=bb[2]-bb[0]
    cells+=f'<text x="30" y="{y+16}" font-family="Jost,sans-serif" font-size="15" fill="#1C1917">{name}</text>'
    sc=190/h; cells+=f'<g transform="translate(40 {y+34-bb[1]*sc:.1f}) scale({sc:.3f})">{g}</g>'
    ic=140; isc=(ic*0.64)/h
    cells+=f'<g transform="translate(240 {y+34})"><rect width="{ic}" height="{ic}" rx="32" fill="{T}"/><g transform="translate({(ic-w*isc)/2:.1f} {(ic-h*isc)/2 - bb[1]*isc:.1f}) scale({isc:.3f})">{gd}</g></g>'
    for j,px in enumerate((40,24,16)):
        cells+=f'<g transform="translate({240+j*50} {y+190-bb[1]*px/h:.1f}) scale({px/h:.3f})">{gp}</g>'
    # lockup: símbolo da linha de base até o topo do l
    s2=ASC/h; gap=XH*0.8; base=y+34+120
    cells+=f'<g transform="translate(430 {base-ASC-bb[1]*s2:.1f}) scale({s2:.3f})">{gp}</g>'
    cells+=f'<path transform="translate({430+w*s2+gap-wb[0]:.1f} {base})" d="{wd}" fill="{T}"/>'
    cells+=f'<rect x="420" y="{base+20}" width="560" height="0" />'
    y+=260
open("golden3.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 {y}"><rect width="1000" height="{y}" fill="{P}"/>{cells}</svg>')
