/**
 * Informação de Fisher para θ = (β₀, β₁, σ²) no modelo normal
 * (esperança do negativo da hessiana da log-verossimilhança):
 *
 *              ⎡  n/σ²        Σxᵢ/σ²        0      ⎤
 *     I(θ)  =  ⎢  Σxᵢ/σ²      Σxᵢ²/σ²       0      ⎥
 *              ⎣  0           0             n/(2σ⁴)⎦
 *
 * Daí Var̂(θ̂) ≈ I(θ̂)⁻¹ e EP = √diag(I⁻¹).
 *
 * Matemática pura — sem React, sem DOM.
 */

import { sums } from './regression'
import type { Sample } from './simulate'

export type Mat3 = number[][]

/** Matriz de informação de Fisher 3×3 avaliada em σ². */
export function fisherInfo(s: Sample, sigma2: number): Mat3 {
  const m = sums(s)
  return [
    [m.n / sigma2, m.sx / sigma2, 0],
    [m.sx / sigma2, m.sxx / sigma2, 0],
    [0, 0, m.n / (2 * sigma2 * sigma2)],
  ]
}

/** Inversa de uma matriz 3×3 pela regra dos cofatores. */
export function invert3x3(m: Mat3): Mat3 {
  const [a, b, c] = m[0]
  const [d, e, f] = m[1]
  const [g, h, i] = m[2]

  const A = e * i - f * h
  const B = -(d * i - f * g)
  const C = d * h - e * g
  const det = a * A + b * B + c * C
  if (det === 0 || !Number.isFinite(det)) {
    return [
      [NaN, NaN, NaN],
      [NaN, NaN, NaN],
      [NaN, NaN, NaN],
    ]
  }
  const D = -(b * i - c * h)
  const E = a * i - c * g
  const F = -(a * h - b * g)
  const G = b * f - c * e
  const H = -(a * f - c * d)
  const I = a * e - b * d

  // A adjunta é a transposta da matriz de cofatores.
  return [
    [A / det, D / det, G / det],
    [B / det, E / det, H / det],
    [C / det, F / det, I / det],
  ]
}

/** Erros-padrão assintóticos: raiz da diagonal de I⁻¹. */
export function standardErrors(inv: Mat3): {
  se0: number
  se1: number
  seSigma2: number
} {
  return {
    se0: Math.sqrt(inv[0][0]),
    se1: Math.sqrt(inv[1][1]),
    seSigma2: Math.sqrt(inv[2][2]),
  }
}

/** Bloco 2×2 de (β₀, β₁) — usado pela elipse de confiança. */
export function block2x2(inv: Mat3): number[][] {
  return [
    [inv[0][0], inv[0][1]],
    [inv[1][0], inv[1][1]],
  ]
}

/** Produto de matrizes 3×3 (utilitário para testes e diagnósticos). */
export function mul3x3(a: Mat3, b: Mat3): Mat3 {
  const out: Mat3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let acc = 0
      for (let k = 0; k < 3; k++) acc += a[i][k] * b[k][j]
      out[i][j] = acc
    }
  }
  return out
}
