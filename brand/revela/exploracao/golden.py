import math
PHI=(1+5**.5)/2
T="#1C1917"; A="#C8553D"; P="#F6F1EA"; G="#2E7DD7"

def spiral_arcs(x0, y0, R, n):
    """Espiral áurea por quartos de círculo, começando no ponto (x0,y0) = topo da haste,
    subindo para a direita e girando no sentido horário. Retorna lista de arcos e quadrados."""
    arcs=[]; squares=[]
    # direções: 0 sobe-direita (centro à direita), depois desce-direita, desce-esquerda, sobe-esquerda
    x, y, r = x0, y0, R
    for i in range(n):
        k = i % 4
        if k == 0: cx, cy = x + r, y;     ex, ey = x + r, y - r; sq=(x, y-r, r)
        if k == 1: cx, cy = x, y + r;     ex, ey = x + r, y + r; sq=(x, y, r)
        if k == 2: cx, cy = x - r, y;     ex, ey = x - r, y + r; sq=(x-r, y, r)
        if k == 3: cx, cy = x, y - r;     ex, ey = x - r, y - r; sq=(x-r, y-r, r)
        arcs.append((x, y, ex, ey, r, cx, cy)); squares.append(sq)
        x, y, r = ex, ey, r / PHI
    return arcs, squares

def eye(x0, y0, R):
    arcs,_ = spiral_arcs(x0, y0, R, 60)
    return arcs[-1][2], arcs[-1][3]

def path_arcs(arcs):
    d = f"M{arcs[0][0]:.3f} {arcs[0][1]:.3f}"
    for (sx, sy, ex, ey, r, cx, cy) in arcs: d += f"A{r:.3f} {r:.3f} 0 0 1 {ex:.3f} {ey:.3f}"
    return d

def build(R=40, narcs=3, s_ratio=1/PHI**3, dot_ratio=None, taper=False):
    """R = raio do 1º arco. Altura total = R·φ² (retângulo áureo vertical de largura R·φ)."""
    s = R * s_ratio                      # espessura do traço
    W = R * PHI                          # largura da forma (R + R/φ)
    H = W * PHI                          # altura: retângulo áureo vertical
    x0 = s/2; top = s/2                  # o eixo do traço; topo do arco no y = top
    y0 = top + R                         # início do arco (topo da haste)
    arcs, squares = spiral_arcs(x0, y0, R, narcs)
    ex, ey = eye(x0, y0, R)
    d_stem = f"M{x0} {H}V{y0}"
    d = d_stem + path_arcs(arcs)[ (len(f'M{arcs[0][0]:.3f} {arcs[0][1]:.3f}')) : ]
    dr = (dot_ratio or 1) * s * PHI / 1.0   # raio do ponto = espessura × φ
    return dict(s=s, W=W + s, H=H, d=d, eye=(ex, ey), dot=dr, arcs=arcs, squares=squares, x0=x0, y0=y0)
