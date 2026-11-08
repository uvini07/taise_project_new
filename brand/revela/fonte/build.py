import sys; sys.path.insert(0,'.')
from glyphs import GL, S, X, C, DSC
from kit import ASC
import pathops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.agl import AGL2UV
SB={"st":S*0.72,"rd":S*0.42,"dg":S*0.1,"op":S*0.25,"none":0}
def build(path):
    order=[".notdef"]+sorted(GL, key=lambda n:(AGL2UV.get(n,0x10000),n))
    fb=FontBuilder(1000,isTTF=False); fb.setupGlyphOrder(order)
    cmap={AGL2UV[n]:n for n in GL if n in AGL2UV}
    fb.setupCharacterMap(cmap)
    cs={}; hm={}
    for n in order:
        # A largura vai DENTRO do desenho (CFF) e na tabela hmtx, com o mesmo valor:
        # alguns sistemas (Safari, Windows) leem a do desenho; com 0, as letras se empilhavam.
        if n==".notdef":
            adv=500; pen=T2CharStringPen(adv,None); lsb=0
        else:
            p,w,l,r=GL[n]
            p=pathops.simplify(p,fix_winding=True,keep_starting_points=False) if len(list(p)) else p
            adv=round(SB[l]+w+SB[r])
            pen=T2CharStringPen(adv,None)
            p.draw(TransformPen(pen,(1,0,0,1,SB[l],0)))
            bp=BoundsPen(None); p.draw(TransformPen(bp,(1,0,0,1,SB[l],0)))
            lsb=round(bp.bounds[0]) if bp.bounds else 0   # margem esquerda real (= xMin do desenho)
        cs[n]=pen.getCharString(); hm[n]=(adv,lsb)
    fb.setupCFF("Revela-Regular",{"FullName":"Revela Regular"},cs,{})
    fb.setupHorizontalMetrics(hm)
    fb.setupHorizontalHeader(ascent=950,descent=-250)
    fb.setupNameTable({"familyName":"Revela","styleName":"Regular","uniqueFontIdentifier":"Revela-Regular-1.0","fullName":"Revela Regular","psName":"Revela-Regular","version":"Version 1.000"})
    fb.setupOS2(sTypoAscender=950,sTypoDescender=-250,sTypoLineGap=0,usWinAscent=1000,usWinDescent=260,sxHeight=round(X),sCapHeight=round(C),achVendID="RVLA",fsType=0)   # fsType 0: pode instalar e usar em qualquer programa
    fb.setupPost(); fb.save(path)
    return len(cmap)
print(build(sys.argv[1]),"caracteres")
