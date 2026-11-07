"""Revela — kit de construção das letras. Unidades: em 1000, y para cima, linha de base = 0."""
import math
from pathops import Path, PathOp, op
PHI=(1+5**.5)/2
X=500.0                    # altura de x
S=X/PHI**3.6               # haste (≈88)
TH=S/PHI                   # traço fino (≈55)
O=X*0.015                  # overshoot das curvas
ASC=X*(1+1/PHI**2)         # ascendente (≈691)
CAP=ASC                    # altura das maiúsculas
DSC=X*0.42                 # descendente (≈210)
K=0.5522847498

def ellipse(cx,cy,rx,ry):
    p=Path(); p.moveTo(cx+rx,cy)
    p.cubicTo(cx+rx,cy+ry*K,cx+rx*K,cy+ry,cx,cy+ry); p.cubicTo(cx-rx*K,cy+ry,cx-rx,cy+ry*K,cx-rx,cy)
    p.cubicTo(cx-rx,cy-ry*K,cx-rx*K,cy-ry,cx,cy-ry); p.cubicTo(cx+rx*K,cy-ry,cx+rx,cy-ry*K,cx+rx,cy)
    p.close(); return p
def poly(pts):
    p=Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    p.close(); return p
def rect(x0,y0,x1,y1): return poly([(x0,y0),(x1,y0),(x1,y1),(x0,y1)])
def U(*ps):
    ps=[p for p in ps if p is not None]; r=ps[0]
    for p in ps[1:]: r=op(r,p,PathOp.UNION)
    return r
def D(a,*bs):
    for b in bs: a=op(a,b,PathOp.DIFFERENCE)
    return a
def I(a,b): return op(a,b,PathOp.INTERSECTION)
def ring(cx,cy,rx,ry,side=None,top=None):
    side=S if side is None else side; top=TH if top is None else top
    return D(ellipse(cx,cy,rx,ry),ellipse(cx,cy,rx-side,ry-top))
def stem(x,y0,y1,w=None): w=S if w is None else w; return rect(x,y0,x+w,y1)
def bar(x0,x1,ytop,h=None): h=TH if h is None else h; return rect(x0,ytop-h,x1,ytop)
def diag(x0,y0,x1,y1,t):
    """Traço reto de (x0,y0) a (x1,y1) com espessura ótica t (bordas de cima/baixo horizontais)."""
    ang=math.atan2(abs(y1-y0),abs(x1-x0)) or 1e-6
    w=t/math.sin(ang)
    return poly([(x0-w/2,y0),(x0+w/2,y0),(x1+w/2,y1),(x1-w/2,y1)])
def clipv(p,y0,y1,x0=-500,x1=2000): return I(p,rect(x0,y0,x1,y1))
def dot(cx,cy,r=None): r=S*0.6 if r is None else r; return ellipse(cx,cy,r,r)
def shift(p,dx,dy=0):
    from fontTools.pens.recordingPen import RecordingPen
    q=Path(); pen=q.getPen()
    from fontTools.pens.transformPen import TransformPen
    p.draw(TransformPen(pen,(1,0,0,1,dx,dy))); return q
def xform(p,a,b,c,d,e,f):
    q=Path(); pen=q.getPen()
    from fontTools.pens.transformPen import TransformPen
    p.draw(TransformPen(pen,(a,b,c,d,e,f))); return q
def mirror_x(p,w): return xform(p,-1,0,0,1,w,0)
def rot180(p,w,h): return xform(p,-1,0,0,-1,w,h)
def bounds(p): return p.bounds
