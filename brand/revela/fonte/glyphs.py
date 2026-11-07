import sys, math; sys.path.insert(0,'.'); sys.path.insert(0,'..')
from kit import *
import fontgen as FG   # o "r" da espiral (mesmo S)

GL={}   # nome -> (path, largura do desenho, tipo lado esq, tipo lado dir)
def g(name,path,w,l="st",r="st"): GL[name]=(path,w,l,r)

# ---------------- minúsculas ----------------
def bowl(w,cy=X/2,ry=X/2+O): return ring(w/2,cy,w/2,ry)
# a (um andar)
w=X*0.92; g("a", U(D(ring((w-S*0.5)/2,X/2,(w-S*0.5)/2,X/2+O),rect(w-S,-60,w+60,X+60)),stem(w-S,0,X)), w,"rd","st")
# b / d / p / q
w=X*0.96
b_=U(D(bowl(w),rect(-60,-60,S,X+60)),stem(0,0,ASC)); g("b",b_,w,"st","rd")
g("d",mirror_x(b_,w),w,"rd","st")
p_=U(D(bowl(w),rect(-60,-60,S,X+60)),stem(0,-DSC,X)); g("p",p_,w,"st","rd")
g("q",mirror_x(p_,w),w,"rd","st")
# c
w=X*0.9; c_=D(bowl(w),rect(w*0.55,X*0.30,w+60,X*0.70)); g("c",c_,w,"rd","op")
# e (E2: terminal reto)
w=X*0.96; bt=X*0.5+TH/2
e_=D(U(bowl(w),bar(S*0.4,w-S*0.4,bt)),rect(w/2+w*0.12,X*0.30,w+60,bt-TH)); g("e",e_,w,"rd","rd")
# o
w=X*1.0; g("o",bowl(w),w,"rd","rd")
# n / h / m / u
def shoulder(w,top=X,yb=0):
    r=w/2
    arch=I(ring(w/2,top-r+O*0, w/2, r+O, S, TH),rect(-60,top-r,w+60,top+60))
    return U(arch,stem(0,yb,top-r+1),stem(w-S,0,top-r+1))
w=X*0.92
n_=U(shoulder(w),stem(0,0,X)); g("n",n_,w)
g("h",U(shoulder(w),stem(0,0,ASC)),w)
g("u",rot180(n_,w,X),w)
wm=X*0.72
m_=U(shoulder(wm),shift(shoulder(wm),wm-S),stem(0,0,X)); g("m",m_,wm*2-S)
# i j l t f
g("dotlessi",stem(0,0,X),S); g("i",U(stem(0,0,X),dot(S/2,X+S*1.5)),S)
jh=X*0.55
j_=U(stem(jh-S,-DSC*0.45,X),I(ring(jh/2-S*0.1,-DSC*0.45,jh/2,DSC*0.55,S,TH),rect(-60,-DSC-60,jh+60,-DSC*0.45)))
g("dotlessj",j_,jh,"op","st"); g("j",U(j_,dot(jh-S/2,X+S*1.5)),jh,"op","st")
g("l",stem(0,0,ASC),S)
tw=X*0.62; g("t",U(stem(tw*0.28,0,X*1.25),bar(0,tw,X)),tw,"op","op")
fw=X*0.62; fr=fw*0.5
f_=U(stem(fw*0.28,0,ASC-fr),I(ring(fw*0.28+fr,ASC-fr,fr,fr,S,TH),rect(fw*0.28-10,ASC-fr,fw*0.28+fr*2,ASC+60)),bar(0,fw*0.85,X))
f_=D(f_,rect(fw*0.28+fr*1.2,ASC-fr*0.9,fw+120,ASC-fr*0.1)); g("f",f_,fw,"op","op")
# r (espiral, sem a luz)
g("r",FG.r_body,FG.r_right-FG.S*0.05,"st","op")
# s
def make_s(w,h,o=O):
    mid=h/2; ru=(h+o-(mid-TH/2))/2; cyu=h+o-ru; rl=(mid+TH/2+o)/2; cyl=-o+rl
    up=ring(w/2,cyu,w/2*0.96,ru); lo=ring(w/2,cyl,w/2,rl)
    up=D(up,rect(w/2,-100,w+100,cyu),rect(w/2+w*0.18,cyu,w+100,cyu+ru*0.45))
    lo=D(lo,rect(-100,cyl,w/2,h+100),rect(-100,cyl-rl*0.45,w/2-w*0.18,cyl))
    return U(up,lo)
w=X*0.82; g("s",make_s(w,X),w,"rd","rd")
# v w x y z k
w=X*0.92
def vshape(w,h,t1=S,t2=TH):
    b=TH*0.42
    return U(diag(t1*0.5,h,w/2,0,t1),diag(w-t2*0.5,h,w/2,0,t2))
g("v",clipv(vshape(w,X),0,X),w,"dg","dg")
ww=X*1.35
g("w",clipv(U(vshape(ww*0.55,X),shift(vshape(ww*0.55,X),ww*0.45)),0,X),ww,"dg","dg")
w=X*0.88; g("x",clipv(U(diag(S*0.5,X,w-S*0.5,0,S),diag(w-TH*0.5,X,TH*0.5,0,TH)),0,X),w,"dg","dg")
w=X*0.92; y_=U(diag(S*0.5,X,w*0.52,0,S),diag(w-TH*0.5,X,w*0.18,-DSC,TH)); g("y",clipv(y_,-DSC,X),w,"dg","dg")
w=X*0.82; g("z",U(bar(0,w,X),bar(0,w,TH),clipv(diag(w-S*0.55,X-TH,S*0.55,TH,S*0.95),TH-1,X-TH+1)),w,"op","op")
w=X*0.86; g("k",U(stem(0,0,ASC),clipv(U(diag(w-TH*0.4,X,S*0.8,X*0.28,TH*1.1),diag(S*1.7,X*0.42,w-S*0.5,0,S)),0,X)),w,"st","dg")
# g (um andar, com gancho)
w=X*0.92; cw=w-S*0.5
gb=U(D(ring(cw/2,X/2,cw/2,X/2+O),rect(w-S,-60,w+60,X+60)),stem(w-S,-DSC*0.45,X))
ghook=I(ring(w/2,-DSC*0.45,w/2,DSC*0.55+O,S,TH),rect(-60,-DSC-60,w+60,-DSC*0.45))
ghook=D(ghook,rect(-60,-DSC*0.45,w*0.12,-DSC*0.2))
g("g",U(gb,ghook),w,"rd","st")

# ---------------- maiúsculas ----------------
C=CAP
w=C*0.86; A_=clipv(U(diag(TH*0.5,0,w/2,C,TH),diag(w-S*0.5,0,w/2,C,S)),0,C)
A_=U(A_,clipv(bar(0,w,C*0.38),0,C)); A_=I(A_,U(vshape(w,C,TH,S) if False else poly([(0,0),(w,0),(w/2+S*0.6,C),(w/2-S*0.6,C)]))); g("A",A_,w,"dg","dg")
w=C*0.66; ru=C*0.235; rl=C*0.265
Bu=I(ring(w*0.62-ru*0.4,C-ru,w*0.38+ru*0.4,ru),rect(w*0.35,0,w+60,C+60)); Bl=I(ring(w-rl*1.0,rl,rl,rl),rect(w*0.35,-60,w+60,C))
g("B",U(stem(0,0,C),bar(0,w*0.36,C),bar(0,w*0.36,C-2*ru+TH),bar(0,w*0.36,TH),Bu,Bl),w,"st","rd")
w=C*0.92; g("C",D(ring(w/2,C/2,w/2,C/2+O),rect(w*0.6,C*0.32,w+60,C*0.68)),w,"rd","op")
w=C*0.86; g("D",U(stem(0,0,C),I(ring(w*0.42,C/2,w*0.58,C/2),rect(w*0.42,-60,w+60,C+60)),bar(0,w*0.43,C),bar(0,w*0.43,TH)),w,"st","rd")
w=C*0.6; g("E",U(stem(0,0,C),bar(0,w,C),bar(0,w*0.9,C/2+TH/2),bar(0,w,TH)),w,"st","op")
g("F",U(stem(0,0,C),bar(0,w,C),bar(0,w*0.9,C/2+TH/2)),w,"st","op")
w=C*0.96; G_=D(ring(w/2,C/2,w/2,C/2+O),rect(w*0.58,C*0.48,w+60,C*0.70))
G_=U(G_,bar(w*0.55,w,C*0.48),stem(w-S,C*0.2,C*0.48)); g("G",G_,w,"rd","st")
w=C*0.78; g("H",U(stem(0,0,C),stem(w-S,0,C),bar(0,w,C/2+TH/2)),w)
g("I",stem(0,0,C),S)
w=C*0.5; J_=U(stem(w-S,C*0.3,C),I(ring(w/2,C*0.3,w/2,C*0.3+O),rect(-60,-60,w+60,C*0.3))); J_=D(J_,rect(-60,C*0.12,w*0.2,C*0.3)); g("J",J_,w,"op","st")
w=C*0.74; g("K",U(stem(0,0,C),clipv(U(diag(w-TH*0.5,C,S*0.9,C*0.36,TH*1.1),diag(S*1.6,C*0.47,w-S*0.5,0,S)),0,C)),w,"st","dg")
w=C*0.55; g("L",U(stem(0,0,C),bar(0,w,TH)),w,"st","op")
w=C*1.0; M_=U(stem(0,0,C),stem(w-S,0,C),clipv(U(diag(S*0.5,C,w/2,C*0.22,TH*1.1),diag(w-S*0.5,C,w/2,C*0.22,TH*1.1)),C*0.22-1,C)); g("M",M_,w)
w=C*0.8; g("N",U(stem(0,0,C),stem(w-S,0,C),clipv(diag(S*0.5,C,w-S*0.5,0,TH*1.15),0,C)),w)
w=C*1.04; g("O",ring(w/2,C/2,w/2,C/2+O),w,"rd","rd")
w=C*0.64; rp=C*0.27
g("P",U(stem(0,0,C),bar(0,w*0.4,C),bar(0,w*0.4,C-2*rp+TH),I(ring(w-rp,C-rp,rp,rp),rect(w-rp,0,w+60,C+60))),w,"st","rd")
w=C*1.04; g("Q",U(ring(w/2,C/2,w/2,C/2+O),clipv(diag(w*0.6,C*0.28,w*0.98,-C*0.06,S),-C*0.06,C*0.35)),w,"rd","rd")
w=C*0.7; rp=C*0.26
g("R",U(stem(0,0,C),bar(0,w*0.44,C),bar(0,w*0.44,C-2*rp+TH),I(ring(w*0.92-rp,C-rp,rp,rp),rect(w*0.92-rp,0,w+60,C+60)),clipv(diag(w*0.5,C-2*rp+TH*0.5,w-S*0.5,0,S),0,C-2*rp+TH)),w,"st","dg")
w=C*0.66; g("S",make_s(w,C),w,"rd","rd")
w=C*0.72; g("T",U(bar(0,w,C),stem(w/2-S/2,0,C)),w,"op","op")
w=C*0.78; ur=w/2
g("U",U(stem(0,ur,C),stem(w-S,ur,C),I(ring(w/2,ur,w/2,ur+O),rect(-60,-60,w+60,ur))),w)
w=C*0.86; g("V",clipv(vshape(w,C),0,C),w,"dg","dg")
w=C*1.3; g("W",clipv(U(vshape(w*0.55,C),shift(vshape(w*0.55,C),w*0.45)),0,C),w,"dg","dg")
w=C*0.82; g("X",clipv(U(diag(S*0.5,C,w-S*0.5,0,S),diag(w-TH*0.5,C,TH*0.5,0,TH)),0,C),w,"dg","dg")
w=C*0.82; g("Y",U(clipv(U(diag(S*0.5,C,w/2,C*0.45,S),diag(w-TH*0.5,C,w/2,C*0.45,TH)),C*0.45-1,C),stem(w/2-S/2,0,C*0.46)),w,"dg","dg")
w=C*0.72; g("Z",U(bar(0,w,C),bar(0,w,TH),clipv(diag(w-S*0.55,C-TH,S*0.55,TH,S*0.95),TH-1,C-TH+1)),w,"op","op")

# ---------------- números (altura C*0.96) ----------------
N=C*0.96
w=N*0.66; g("zero",ring(w/2,N/2,w/2,N/2+O),w,"rd","rd")
w=N*0.46; g("one",U(stem(w-S,0,N),clipv(diag(0,N*0.78,w-S*0.6,N,TH*1.1),N*0.7,N)),w,"op","st")
w=N*0.62; r2=w/2
two=U(D(I(ring(w/2,N-r2,w/2,r2+O),rect(-60,N-r2*1.05,w+60,N+60)),rect(-60,N-r2*1.05,w*0.18,N-r2*0.55)),
      clipv(diag(w-S*0.55,N-r2,S*0.55,TH,S),TH-1,N-r2+1),bar(0,w,TH),I(ring(w/2,N-r2,w/2,r2+O),rect(w/2,N-r2*1.6,w+60,N-r2)))
g("two",two,w,"rd","op")
w=N*0.6; ru=N*0.24; rl=N*0.27
three=U(D(I(ring(w-ru-S*0.0,N-ru,ru+w*0.08,ru),rect(w*0.28,-60,w+60,N+60)),rect(-60,N-ru*1.3,w*0.4,N-ru*0.6)),
        D(I(ring(w-rl,rl,rl,rl),rect(w*0.2,-60,w+60,N)),rect(-60,rl*0.4,w*0.38,rl*1.2)),bar(w*0.3,w*0.62,N-2*ru+TH*0.5))
g("three",three,w,"op","rd")
w=N*0.66; g("four",U(stem(w*0.66,0,N),bar(0,w,N*0.3),clipv(diag(S*0.5,N*0.3-TH,w*0.66+S*0.5,N,TH*1.1),N*0.3-TH,N)),w,"dg","op")
w=N*0.6; r5=N*0.3
five=U(bar(w*0.12,w,N),stem(w*0.12,N*0.56,N),bar(w*0.12,w*0.55,N*0.58),D(I(ring(w-r5*1.02,r5,r5*1.02,r5+O),rect(w*0.42,-60,w+60,N*0.62)),rect(-60,r5*0.25,w*0.4,r5*1.0)))
five=U(five,D(ring(w-r5*1.02,r5,r5*1.02,r5+O),rect(w*0.42,-60,w+60,N),rect(-60,r5*0.35,w*0.42,N)))
g("five",five,w,"op","rd")
w=N*0.64; r6=w/2
six=U(ring(w/2,r6,w/2,r6+O),D(I(ring(w*0.9,r6,w*0.9,N-r6),rect(-60,r6,w*0.9,N+60)),rect(w*0.6,N*0.75,w+60,N+60)))
g("six",six,w,"rd","rd"); g("nine",rot180(six,w,N),w,"rd","rd")
w=N*0.6; g("seven",U(bar(0,w,N),clipv(diag(w-S*0.55,N-TH,w*0.28,0,S),0,N-TH+1)),w,"op","dg")
w=N*0.62; g("eight",U(ring(w/2,N*0.76,w*0.45,N*0.24+O),ring(w/2,N*0.27,w/2,N*0.27+O)),w,"rd","rd")

# ---------------- pontuação ----------------
pd=S*0.62
g("space",Path(),X*0.5,"none","none")
g("period",dot(pd,pd,pd),pd*2,"op","op")
cm=U(dot(pd,pd,pd),clipv(diag(pd*1.4,pd,pd*0.4,-pd*2.2,TH*1.1),-pd*2.2,pd)); g("comma",cm,pd*2,"op","op")
g("colon",U(dot(pd,pd,pd),dot(pd,X-pd,pd)),pd*2,"op","op")
g("semicolon",U(cm,dot(pd,X-pd,pd)),pd*2,"op","op")
g("exclam",U(stem(pd-S/2,pd*2.8,C),dot(pd,pd,pd)),pd*2,"op","op")
w=X*0.62; q_=U(D(I(ring(w/2,C-w/2,w/2,w/2),rect(-60,C-w*0.55,w+60,C+60)),rect(-60,C-w*0.55,w*0.2,C-w*0.25)),I(ring(w/2,C-w/2,w/2,w/2),rect(w/2,C-w*0.9,w+60,C-w*0.5)),stem(w/2-S/2,pd*2.8,C-w*0.75),dot(w/2,pd,pd))
g("question",q_,w,"op","op")
g("hyphen",bar(0,X*0.5,X*0.5+TH/2),X*0.5,"op","op")
g("endash",bar(0,X*0.9,X*0.5+TH/2),X*0.9,"op","op")
g("quotesingle",stem(0,C*0.7,C,S*0.8),S*0.8,"op","op")
g("quotedbl",U(stem(0,C*0.7,C,S*0.8),stem(S*1.6,C*0.7,C,S*0.8)),S*2.4,"op","op")
pw=X*0.38
par=D(I(ring(pw,C*0.38,pw,C*0.62+DSC*0.3,S,TH),rect(-60,-DSC,pw,C+60)),rect(-60,-DSC*1.5,pw+60,-DSC*0.8))
g("parenleft",par,pw,"op","op"); g("parenright",mirror_x(par,pw),pw,"op","op")
w=X*0.62; g("slash",clipv(diag(0+S*0.5,-DSC*0.3,w-S*0.5,C,S*0.9),-DSC*0.3,C),w,"dg","dg")
w=X*0.8; g("plus",U(bar(0,w,X*0.5+TH/2),stem(w/2-S/2,X*0.5-w/2,X*0.5+w/2)),w,"op","op")
g("equal",U(bar(0,w,X*0.66),bar(0,w,X*0.66-TH*2.6)),w,"op","op")
w=X*1.2; pr=w*0.2
g("percent",U(ring(pr,C-pr,pr,pr,TH*1.2,TH),ring(w-pr,pr,pr,pr,TH*1.2,TH),clipv(diag(w*0.2,0,w*0.8,C,TH*1.1),0,C)),w,"rd","rd")
w=X*1.35; at=U(ring(w/2,X*0.42,w/2,X*0.72,TH*1.2,TH),shift(GL["a"][0],w/2-X*0.46*0.92/1,X*0.42-X/2+0))
g("at",D(at,rect(w*0.72,X*0.30,w+60,X*0.38)),w,"rd","rd")


# ---------------- correções ----------------
def bowl_right(cx, ytop, ybot, xr):
    """Meia-barriga à direita de cx, entre ybot e ytop, até a borda xr."""
    ry=(ytop-ybot)/2; cy=ybot+ry
    return I(ring(cx,cy,xr-cx,ry),rect(cx,ybot-60,xr+60,ytop+60))
# B
w=C*0.66; mid=C*0.53
cu=w*0.5; cl=w*0.46
g("B",U(stem(0,0,C),bowl_right(cu,C,mid-TH*0.5,w*0.92),bowl_right(cl,mid+TH*0.5,0,w),
        bar(0,cu+1,C),bar(0,max(cu,cl)+1,mid+TH*0.5),bar(0,cl+1,TH)),w,"st","rd")
# P e R
w=C*0.64; mid=C*0.44; cp_=w*0.48
P_=U(stem(0,0,C),bowl_right(cp_,C,mid,w),bar(0,cp_+1,C),bar(0,cp_+1,mid+TH))
g("P",P_,w,"st","rd")
w=C*0.7; cr=w*0.44
g("R",U(stem(0,0,C),bowl_right(cr,C,mid,w*0.9),bar(0,cr+1,C),bar(0,cr+1,mid+TH),clipv(diag(cr,mid+TH*0.5,w-S*0.5,0,S),0,mid+TH)),w,"st","dg")
# f
fw=X*0.62; fr=fw*0.42; sx=fw*0.22
hook=I(ring(sx+fr,ASC-fr,fr,fr),rect(sx-20,ASC-fr,sx+fr*2+20,ASC+60))
hook=D(hook,rect(sx+fr*1.55,ASC-fr-10,sx+fr*2+60,ASC-fr*0.25))
g("f",U(stem(sx,0,ASC-fr+1),hook,bar(0,fw*0.82,X)),fw,"op","op")
# J
w=C*0.5; jr=w/2
g("J",U(stem(w-S,jr,C),I(ring(w/2,jr,w/2,jr+O),rect(-60,-60,w+60,jr))),w,"op","st")
# 3
N=C*0.96; w=N*0.6; mid=N*0.55
cu=w*0.45; cl=w*0.42
three=U(bowl_right(cu,N,mid-TH*0.5,w*0.9),bowl_right(cl,mid+TH*0.5,0,w),bar(w*0.08,cu+1,N),bar(w*0.3,max(cu,cl)+1,mid+TH*0.5),bar(0,cl+1,TH))
g("three",three,w,"op","rd")
# ?
w=X*0.66; r=w/2; cy=C-r; ye=cy-r*0.45
qa=U(I(ring(w/2,cy,w/2,r),rect(-60,cy,w+60,C+60)),I(ring(w/2,cy,w/2,r),rect(w/2,ye,w+60,cy)))
qa=D(qa,rect(-60,cy-1,S*0.9,cy+r*0.25))
q_=U(qa,bar(w/2-S/2,w-S*0.5,ye+TH),stem(w/2-S/2,pd*2.9,ye+TH),dot(w/2,pd,pd))
g("question",q_,w,"op","op")
# @
R_=X*0.66; cx=R_; cy=X*0.42
inner=xform(GL["a"][0],0.6,0,0,0.6,cx-X*0.92*0.3,cy-X*0.3)
outer=D(ring(cx,cy,R_,R_*1.05,TH*1.25,TH),rect(cx+R_*0.32,cy-R_*1.2,cx+R_*1.2,cy-R_*0.05))
g("at",U(outer,inner),R_*2,"rd","rd")

# ---------------- acentos ----------------
aw=X*0.36
acute=clipv(diag(aw*0.25,0,aw*0.85,X*0.3,TH*1.25),0,X*0.3)
grave=mirror_x(acute,aw)
circ=clipv(U(diag(TH*0.6,0,aw/2,X*0.28,TH*1.15),diag(aw-TH*0.6,0,aw/2,X*0.28,TH*1.15)),0,X*0.28)
def tilde_path(w,h,t):
    pts=[]; N_=40
    for i in range(N_+1):
        x=w*i/N_; y=h/2+h/2*math.sin(math.pi*2*i/N_)
        pts.append((x,y))
    up=[(x,y+t/2) for x,y in pts]; dn=[(x,y-t/2) for x,y in reversed(pts)]
    return poly(up+dn)
tilde=tilde_path(aw*1.15,X*0.14,TH*1.05)
dier=U(dot(pd*0.8,pd*0.8,pd*0.8),dot(aw*1.0-pd*0.8,pd*0.8,pd*0.8))
cedw=X*0.3
cedilla=U(stem(cedw*0.35,-DSC*0.35,0,TH),D(I(ring(cedw*0.35+cedw*0.25,-DSC*0.55,cedw*0.32,DSC*0.22,TH*1.1,TH*0.9),rect(cedw*0.35,-DSC,cedw+60,0)),rect(-60,-DSC,cedw*0.35+1,-DSC*0.55)))
MARKS={"acute":(acute,aw),"grave":(grave,aw),"circumflex":(circ,aw),"tilde":(tilde,aw*1.15),"dieresis":(dier,aw)}
for mk,(mp,mw) in MARKS.items(): g(mk,shift(mp,0,X+S*0.9),mw,"op","op")

def compose(name, base, mark, upper=False):
    bp,bw,l,r=GL[base]; mp,mw=MARKS[mark]
    top=(C if upper else X)+ (S*0.75 if upper else S*0.9)
    if base=="dotlessi": top=X+S*0.9
    g(name,U(bp,shift(mp,(bw-mw)/2,top)),bw,l,r)
ACC=[("a","agrave","grave"),("a","aacute","acute"),("a","acircumflex","circumflex"),("a","atilde","tilde"),("a","adieresis","dieresis"),
     ("e","egrave","grave"),("e","eacute","acute"),("e","ecircumflex","circumflex"),("e","edieresis","dieresis"),
     ("dotlessi","igrave","grave"),("dotlessi","iacute","acute"),("dotlessi","icircumflex","circumflex"),("dotlessi","idieresis","dieresis"),
     ("o","ograve","grave"),("o","oacute","acute"),("o","ocircumflex","circumflex"),("o","otilde","tilde"),("o","odieresis","dieresis"),
     ("u","ugrave","grave"),("u","uacute","acute"),("u","ucircumflex","circumflex"),("u","udieresis","dieresis"),("n","ntilde","tilde")]
for base,name,mk in ACC:
    compose(name,base,mk)
    B=base.upper() if base!="dotlessi" else "I"
    compose(name[0].upper()+name[1:] if base!="dotlessi" else "I"+name[1:],B,mk,upper=True)
# cedilha
cp,cw_,l,r=GL["c"]; g("ccedilla",U(cp,shift(cedilla,cw_/2-cedw*0.4)),cw_,l,r)
Cp,Cw,l,r=GL["C"]; g("Ccedilla",U(Cp,shift(cedilla,Cw/2-cedw*0.4)),Cw,l,r)

UNI={}
for ch in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ": UNI[ord(ch)]=ch
for i,n in enumerate(["zero","one","two","three","four","five","six","seven","eight","nine"]): UNI[48+i]=n
UNI.update({32:"space",46:"period",44:"comma",58:"colon",59:"semicolon",33:"exclam",63:"question",45:"hyphen",0x2013:"endash",
    39:"quotesingle",34:"quotedbl",40:"parenleft",41:"parenright",47:"slash",43:"plus",61:"equal",37:"percent",64:"at",
    0xB4:"acute",0x60:"grave",0x5E:"circumflex",0x7E:"tilde",0xA8:"dieresis",0x131:"dotlessi",0xE7:"ccedilla",0xC7:"Ccedilla"})
import unicodedata
for name in list(GL):
    for ch_code in range(0xC0,0x180):
        try: un=unicodedata.name(chr(ch_code))
        except ValueError: continue
