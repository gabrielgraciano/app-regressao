/**
 * Escala de cor perceptualmente uniforme (viridis), por interpolação linear
 * entre 11 pontos de ancoragem. Função pura — sem React, sem DOM.
 */

const ANCORAS: [number, number, number][] = [
  [68, 1, 84], // 0.0
  [72, 40, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [53, 183, 121],
  [109, 205, 89],
  [180, 222, 44],
  [220, 227, 25],
  [253, 231, 37], // 1.0
]

/** Cor viridis para `t ∈ [0, 1]` (valores fora da faixa são truncados). */
export function viridis(t: number): [number, number, number] {
  const u = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0))
  const pos = u * (ANCORAS.length - 1)
  const i = Math.min(ANCORAS.length - 2, Math.floor(pos))
  const f = pos - i
  const a = ANCORAS[i]
  const b = ANCORAS[i + 1]
  return [
    Math.round(a[0] + f * (b[0] - a[0])),
    Math.round(a[1] + f * (b[1] - a[1])),
    Math.round(a[2] + f * (b[2] - a[2])),
  ]
}

/** Mesma cor em `rgb(...)`, para usar em `strokeStyle`/CSS. */
export function viridisCss(t: number): string {
  const [r, g, b] = viridis(t)
  return `rgb(${r}, ${g}, ${b})`
}
