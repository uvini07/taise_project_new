import sys, math; sys.path.insert(0,'.')
import fontgen as F
from fontgen import *
def e_base():
    w=X*0.96; cx=w/2; cy=X/2
    rg=ring(cx,cy,w/2,X/2+O,S,TH)
    return w,cx,cy,rg
def e1():  # abertura com corte reto pelo centro (ângulo -φ graus ~ -32°), barra no meio
    w,cx,cy,rg=e_base()
    bt=X*0.5+TH/2
    bar=rect(S*0.4,bt-TH,w-S*0.4,bt)
    e=U(rg,bar)
    ang=math.radians(-32); L=w
    # cunha a partir do centro: entre a barra (horizontal) e a linha a -32°
    cut=poly([(cx,bt-TH),(cx+L,bt-TH),(cx+L*math.cos(ang)*1.2,bt-TH+L*math.sin(ang)*1.2)])
    return D(e,cut),w
def e2():  # terminal horizontal limpo: corte da barra até a altura do traço fino × φ
    w,cx,cy,rg=e_base()
    bt=X*0.5+TH/2
    bar=rect(S*0.4,bt-TH,w-S*0.4,bt)
    e=U(rg,bar)
    y1=bt-TH; y0=X*0.30
    cut=rect(cx+w*0.12,y0,w+40,y1)
    return D(e,cut),w
def e3():  # corte radial: terminal perpendicular ao contorno (mais "caligráfico" e certo)
    w,cx,cy,rg=e_base()
    bt=X*0.5+TH/2
    bar=rect(S*0.4,bt-TH,w-S*0.4,bt)
    e=U(rg,bar)
    a=math.radians(-28); R=w
    cut=poly([(cx,cy-TH/2),(cx+R,cy-TH/2),(cx+R,cy+R*math.tan(a)),(cx,cy-TH/2)])
    # o corte é um setor do centro: borda inferior da barra até a linha radial a -28°
    cut=poly([(cx, bt-TH),(cx+R, bt-TH),(cx+R*math.cos(a)*1.3, cy+R*math.sin(a)*1.3)])
    return D(e,cut),w
def e4():  # fechado (sem abertura): e totalmente geométrico, só barra
    w,cx,cy,rg=e_base()
    bt=X*0.5+TH/2
    bar=rect(S*0.4,bt-TH,w-S*0.4,bt)
    e=U(rg,bar)
    cut=rect(w-S*1.05,bt-TH-TH*1.0,w+20,bt-TH-0.1)  # pequena fresta só sob a barra
    return D(e,rect(w*0.55,X*0.36,w+20,bt-TH)),w
OPTS={"E1 · Corte em ângulo pelo centro":e1,"E2 · Terminal reto (horizontal)":e2,"E3 · Corte radial (perpendicular à curva)":e3,"E4 · Abertura curta":e4}
out=""; y=10
for name,fn in OPTS.items():
    F.G["e"]=fn()
    svg,w,h=wordmark_svg(scale=0.22)
    inner=svg[svg.index(">",svg.index("<title>"))+1:]
    inner=inner[inner.index("</title>")+8:-6]
    out+=f'<text x="30" y="{y+22}" font-family="Jost,sans-serif" font-size="15" fill="#8C857D">{name}</text>'
    out+=f'<g transform="translate(30 {y+40})">{inner}</g>'
    # e grande ao lado
    d=to_svg_d(F.G["e"][0],0,(X+O)*0.3,0.3)
    out+=f'<path transform="translate(680 {y+45})" d="{d}" fill="#1C1917"/>'
    y+=230
open("evars.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 {y}"><rect width="860" height="{y}" fill="#F6F1EA"/>{out}</svg>')
