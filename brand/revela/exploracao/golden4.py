import sys, glob, math; sys.path.insert(0,'.')
from golden import *
from textpath import text_path
SERIF=glob.glob("../fonts/fontsource-fraunces-*/files/fraunces-latin-400-normal.woff")[0]

def sym(R=40, turns=1.5, s0=1/PHI**2, k=PHI, dot=1/PHI**3.4, f=T, l=A, guides=False, dotmode="eye"):
    s=R*s0; x0=s/2; y0=s/2+R; H=R*PHI*PHI
    n=math.ceil(turns); arcs,squares=spiral_arcs(x0,y0,R,n)
    pts=[]
    for i,(sx,sy,e1,e2,r,cx,cy) in enumerate(arcs):
        frac=min(1,turns-i)
        a0=math.atan2(sy-cy,sx-cx); a1=math.atan2(e2-cy,e1-cx)
        if a1<a0: a1+=2*math.pi
        a1=a0+(a1-a0)*frac
        N=max(2,int(30*frac))
        for j in range(N+1):
            t=j/N; a=a0+(a1-a0)*t
            w=s/k**(i+t*frac)
            pts.append((cx+r*math.cos(a),cy+r*math.sin(a),math.cos(a),math.sin(a),w))
    outer=[(p[0]+p[2]*p[4]/2,p[1]+p[3]*p[4]/2) for p in pts]
    inner=[(p[0]-p[2]*p[4]/2,p[1]-p[3]*p[4]/2) for p in pts]
    bottom=s/2+H
    d=f"M{x0-s/2:.2f} {bottom:.2f}V{y0:.2f}"+"".join(f"L{x:.2f} {y:.2f}" for x,y in outer)+"".join(f"L{x:.2f} {y:.2f}" for x,y in reversed(inner))+f"L{x0+s/2:.2f} {y0:.2f}V{bottom:.2f}Z"
    ex_,ey_,_,_,we=pts[-1]
    out=""
    if guides:
        for (x,y,r) in squares: out+=f'<rect x="{x:.2f}" y="{y:.2f}" width="{r:.2f}" height="{r:.2f}" fill="none" stroke="{G}" stroke-width=".35"/>'
        out+=f'<rect x="{x0:.2f}" y="{s/2:.2f}" width="{R*PHI:.2f}" height="{H:.2f}" fill="none" stroke="{G}" stroke-width=".6"/>'
        for (_,_,_,_,r,cx,cy) in arcs: out+=f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="none" stroke="{G}" stroke-width=".25" stroke-dasharray="1 1.2"/>'
    out+=f'<path d="{d}" fill="{f}"/><circle cx="{ex_:.2f}" cy="{ey_:.2f}" r="{we/2:.2f}" fill="{f}"/>'
    ex,ey=eye(x0,y0,R)
    if dotmode=="eye": dx,dy=ex,ey
    else:  # abaixo da ponta, no eixo vertical da ponta, a uma distância φ·raio
        dx=ex_; dy=ey_+ (R*dot)*PHI*1.6
    out+=f'<circle cx="{dx:.2f}" cy="{dy:.2f}" r="{R*dot:.2f}" fill="{l}"/>'
    xs=[p[0] for p in outer]+[dx+R*dot]; ys=[p[1] for p in outer]
    return out,(0,min(ys),max(xs)+1,bottom)

VARS={
 "R1 · Ombro até 1¼ volta + luz no olho da espiral": dict(turns=1.25),
 "R2 · Ombro até 1½ volta + luz no olho": dict(turns=1.5),
 "R3 · Ombro 1¼ volta + luz caindo da ponta": dict(turns=1.25, dotmode="drop"),
 "R4 · Só o 1º arco (r clássico) + luz no olho": dict(turns=1.0),
}
wd,ww,wb=text_path(SERIF,"revela",100,0,0,-0.005)
_,_,lb=text_path(SERIF,"l",100); ASC=-lb[1]
_,_,eb=text_path(SERIF,"e",100); XH=-eb[1]
cells=""; y=20
for name,kw in VARS.items():
    g,bb=sym(guides=True,**kw); gp,_=sym(**kw); gd,_=sym(f=P,**kw)
    h=bb[3]-bb[1]; w=bb[2]-bb[0]
    cells+=f'<text x="30" y="{y+16}" font-family="Jost,sans-serif" font-size="15" fill="#1C1917">{name}</text>'
    sc=170/h; cells+=f'<g transform="translate(40 {y+34-bb[1]*sc:.1f}) scale({sc:.3f})">{g}</g>'
    ic=130; isc=(ic*0.64)/h
    cells+=f'<g transform="translate(230 {y+34})"><rect width="{ic}" height="{ic}" rx="30" fill="{T}"/><g transform="translate({(ic-w*isc)/2:.1f} {(ic-h*isc)/2-bb[1]*isc:.1f}) scale({isc:.3f})">{gd}</g></g>'
    for j,px in enumerate((40,24,16)):
        cells+=f'<g transform="translate({230+j*48} {y+175-bb[1]*px/h:.1f}) scale({px/h:.3f})">{gp}</g>'
    s2=ASC/h; gap=XH*0.8; base=y+34+110
    cells+=f'<g transform="translate(410 {base-ASC-bb[1]*s2:.1f}) scale({s2:.3f})">{gp}</g>'
    cells+=f'<path transform="translate({410+w*s2+gap-wb[0]:.1f} {base})" d="{wd}" fill="{T}"/>'
    y+=240
open("golden4.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 {y}"><rect width="960" height="{y}" fill="{P}"/>{cells}</svg>')
