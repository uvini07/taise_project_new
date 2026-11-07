import sys; sys.path.insert(0,'.')
from glyphs import GL, S, X, C, DSC
from kit import ASC
import pathops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.agl import AGL2UV
SB={"st":S*0.72,"rd":S*0.42,"dg":S*0.1,"op":S*0.25,"none":0}
def build(path):
    order=[".notdef"]+sorted(GL, key=lambda n:(AGL2UV.get(n,0x10000),n))
    fb=FontBuilder(1000,isTTF=False); fb.setupGlyphOrder(order)
    cmap={AGL2UV[n]:n for n in GL if n in AGL2UV}
    fb.setupCharacterMap(cmap)
    cs={}; hm={}
    for n in order:
        pen=T2CharStringPen(0,None)
        if n==".notdef":
            adv=500
        else:
            p,w,l,r=GL[n]
            p=pathops.simplify(p,fix_winding=True,keep_starting_points=False) if len(list(p)) else p
            p.draw(TransformPen(pen,(1,0,0,1,SB[l],0)))
            adv=round(SB[l]+w+SB[r])
        cs[n]=pen.getCharString(); hm[n]=(adv,0)
    fb.setupCFF("Revela-Regular",{"FullName":"Revela Regular"},cs,{})
    fb.setupHorizontalMetrics(hm)
    fb.setupHorizontalHeader(ascent=950,descent=-250)
    fb.setupNameTable({"familyName":"Revela","styleName":"Regular","uniqueFontIdentifier":"Revela-Regular-1.0","fullName":"Revela Regular","psName":"Revela-Regular","version":"Version 1.000"})
    fb.setupOS2(sTypoAscender=950,sTypoDescender=-250,sTypoLineGap=0,usWinAscent=1000,usWinDescent=260,sxHeight=round(X),sCapHeight=round(C),achVendID="RVLA")
    fb.setupPost(); fb.save(path)
    return len(cmap)
print(build(sys.argv[1]),"caracteres")
