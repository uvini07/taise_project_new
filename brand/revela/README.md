# Revela — marca

Plataforma para fotógrafas (site, agenda, seleção protegida e entrega de fotos).
Veja o resumo visual em `manual-de-marca.png`.

## Conceito (v2)
O **“r” é desenhado pela espiral áurea**, a regra clássica de composição na fotografia, que leva o olhar ao ponto de interesse.
A espiral é cortada antes de voltar à haste (para ler “r”, não “P”) e a **luz âmbar** cai logo abaixo da ponta.
As outras letras são da **fonte própria Revela Display**, construída com a mesma geometria. A v1 (foto instantânea) está em `exploracao/v1-foto-instantanea/`.

## Arquivos
| Arquivo | Uso |
|---|---|
| `svg/revela-logo.svg` | Logo principal |
| `svg/revela-logo-negativo.svg` | Sobre fundos escuros |
| `svg/revela-logo-mono-preto.svg` / `-mono-branco.svg` | Uma cor só |
| `svg/revela-simbolo.svg` / `-negativo.svg` | Só o “r” com a luz |
| `svg/revela-icone-app.svg` / `revela-favicon.svg` | Ícone de app e aba do navegador |
| `png/` | Exportações (ícone 1024/512/192/180, favicon 64/32/16, logos) |
| `fonte/RevelaDisplay-Regular.otf` | Fonte própria (por enquanto r, e, v, l, a) |
| `fonte/fontgen.py`, `fonte/pack.py` | Scripts que constroem as letras e geram o pacote |

## Fonte própria: Revela Display
- Altura de x = X; haste = X/φ³·⁶; traço fino = haste/φ; ascendente = X·(1 + 1/φ²).
- Curvas de círculo com compensação ótica de 1,5%.
- Espaçamento por tipo de lado: reto 0,75 × haste, redondo 0,4, diagonal 0,12.
- O “r” afina ÷√φ a cada quarto de volta; a luz tem raio = haste/φ·0,9 e respiro = traço fino.

## Cores
| Nome | Hex | Papel |
|---|---|---|
| Tinta | `#1C1917` | Textos e símbolo (câmara escura) |
| Âmbar revelação | `#C8553D` | Só a luz do símbolo e destaques pontuais |
| Papel | `#F6F1EA` | Fundos (papel fotográfico) |
| Prata | `#8C857D` | Textos de apoio |

## Tipografia
- **Revela Display** (própria): só o logo e títulos curtos.
- **Jost 400/500** (OFL, livre): textos e rótulos; rótulos em caixa alta com entreletra +20%.

## Uso
- Área de proteção = 1 × altura de x em volta do logo.
- Tamanho mínimo: logo 96 px (25 mm); símbolo 16 px — abaixo de 24 px use o favicon.

## Não fazer
Esticar ou inclinar · refazer o nome em outra fonte · usar “Revela” com R maiúsculo no logo · pintar as letras de âmbar (o âmbar é só a luz) ·
sombras, brilhos ou degradês · aplicar sobre fotos agitadas sem fundo · separar a luz do “r”.
