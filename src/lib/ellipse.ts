/**
 * Elipse de confiança para (β₀, β₁) a partir do bloco 2×2 de I⁻¹.
 *
 * A região de confiança assintótica de nível `level` é
 *
 *     { θ : (θ − θ̂)ᵀ Σ⁻¹ (θ − θ̂) ≤ c },   Σ = bloco 2×2 de I(θ̂)⁻¹,
 *
 * com `c` o quantil `level` de uma qui-quadrado com 2 graus de liberdade —
 * que tem forma fechada: c = −2·log(1 − level).
 *
 * Matemática pura — sem React, sem DOM.
 */

/** Quantil da qui-quadrado com 2 graus de liberdade (forma fechada). */
export function chi2Quantile2gl(level: number): number {
  return -2 * Math.log(1 - level)
}

export type Eigen2 = {
  lambda1: number
  lambda2: number
  v1: [number, number]
  v2: [number, number]
}

/**
 * Autovalores/autovetores de uma matriz simétrica 2×2 [[a,b],[b,d]],
 * em forma fechada. `lambda1 ≥ lambda2`, autovetores ortonormais.
 */
export function eigenSym2x2(m: number[][]): Eigen2 {
  const a = m[0][0]
  const b = m[0][1]
  const d = m[1][1]
  const tr = a + d
  const disc = Math.sqrt(Math.max(0, (a - d) * (a - d) + 4 * b * b))
  const lambda1 = (tr + disc) / 2
  const lambda2 = (tr - disc) / 2

  let v1: [number, number]
  if (Math.abs(b) > 1e-300) {
    v1 = [b, lambda1 - a]
  } else {
    // Já é diagonal: eixos alinhados aos eixos coordenados.
    v1 = a >= d ? [1, 0] : [0, 1]
  }
  const norma = Math.hypot(v1[0], v1[1]) || 1
  v1 = [v1[0] / norma, v1[1] / norma]
  const v2: [number, number] = [-v1[1], v1[0]]
  return { lambda1, lambda2, v1, v2 }
}

/**
 * Pontos da elipse de confiança, prontos para virar um `polygon` em SVG.
 *
 * @param inv2x2 bloco 2×2 de I⁻¹ (matriz de covariância assintótica de β̂)
 * @param center centro (β̂₀, β̂₁)
 * @param level  nível de confiança, por exemplo 0.95
 * @param points quantidade de pontos da poligonal
 */
export function confidenceEllipse(
  inv2x2: number[][],
  center: [number, number],
  level: number,
  points: number,
): [number, number][] {
  const c = chi2Quantile2gl(level)
  const { lambda1, lambda2, v1, v2 } = eigenSym2x2(inv2x2)
  const r1 = Math.sqrt(Math.max(0, c * lambda1))
  const r2 = Math.sqrt(Math.max(0, c * lambda2))
  const m = Math.max(3, Math.floor(points))
  const saida: [number, number][] = new Array(m)
  for (let k = 0; k < m; k++) {
    const t = (2 * Math.PI * k) / m
    const ct = Math.cos(t)
    const st = Math.sin(t)
    saida[k] = [
      center[0] + r1 * ct * v1[0] + r2 * st * v2[0],
      center[1] + r1 * ct * v1[1] + r2 * st * v2[1],
    ]
  }
  return saida
}
