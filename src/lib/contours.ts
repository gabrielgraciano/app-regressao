/**
 * Curvas de nível por *marching squares* numa grade regular.
 * Função pura — sem React, sem DOM (o desenho fica a cargo de quem chama).
 */

/** Segmento em coordenadas de grade: [col1, lin1, col2, lin2]. */
export type Segmento = [number, number, number, number]

type Ponto = [number, number]

function interp(v0: number, v1: number, nivel: number): number {
  const d = v1 - v0
  if (d === 0 || !Number.isFinite(d)) return 0.5
  return (nivel - v0) / d
}

/**
 * Segmentos da curva de nível `nivel` sobre a grade `v` de `cols × linhas`
 * (percorrida em ordem linha-a-linha, `v[linha * cols + coluna]`).
 *
 * As coordenadas devolvidas estão na própria grade: coluna em [0, cols−1] e
 * linha em [0, linhas−1], com valores fracionários nas arestas.
 */
export function marchingSquares(
  v: ArrayLike<number>,
  cols: number,
  linhas: number,
  nivel: number,
): Segmento[] {
  const saida: Segmento[] = []
  if (cols < 2 || linhas < 2) return saida

  for (let j = 0; j < linhas - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const tl = v[j * cols + i]
      const tr = v[j * cols + i + 1]
      const br = v[(j + 1) * cols + i + 1]
      const bl = v[(j + 1) * cols + i]
      if (
        !Number.isFinite(tl) ||
        !Number.isFinite(tr) ||
        !Number.isFinite(br) ||
        !Number.isFinite(bl)
      ) {
        continue
      }

      let caso = 0
      if (tl > nivel) caso |= 8
      if (tr > nivel) caso |= 4
      if (br > nivel) caso |= 2
      if (bl > nivel) caso |= 1
      if (caso === 0 || caso === 15) continue

      const topo: Ponto = [i + interp(tl, tr, nivel), j]
      const dir: Ponto = [i + 1, j + interp(tr, br, nivel)]
      const base: Ponto = [i + interp(bl, br, nivel), j + 1]
      const esq: Ponto = [i, j + interp(tl, bl, nivel)]

      const push = (a: Ponto, b: Ponto) => saida.push([a[0], a[1], b[0], b[1]])

      switch (caso) {
        case 1:
        case 14:
          push(esq, base)
          break
        case 2:
        case 13:
          push(base, dir)
          break
        case 3:
        case 12:
          push(esq, dir)
          break
        case 4:
        case 11:
          push(topo, dir)
          break
        case 6:
        case 9:
          push(topo, base)
          break
        case 7:
        case 8:
          push(esq, topo)
          break
        // casos ambíguos (sela): resolvidos pela média dos quatro cantos
        case 5: {
          const media = (tl + tr + br + bl) / 4
          if (media > nivel) {
            push(esq, topo)
            push(base, dir)
          } else {
            push(esq, base)
            push(topo, dir)
          }
          break
        }
        case 10: {
          const media = (tl + tr + br + bl) / 4
          if (media > nivel) {
            push(topo, dir)
            push(esq, base)
          } else {
            push(esq, topo)
            push(base, dir)
          }
          break
        }
        default:
          break
      }
    }
  }
  return saida
}
