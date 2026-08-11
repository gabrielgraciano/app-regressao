/**
 * Simulação do modelo de regressão linear simples
 *
 *     Yᵢ = β₀ + β₁xᵢ + εᵢ,   εᵢ ~ N(0, σ²) i.i.d.,   i = 1..n
 *
 * Matemática pura — sem React, sem DOM.
 */

import { makeNormal, mulberry32 } from './rng'

export type Params = {
  n: number
  beta0: number
  beta1: number
  sigma: number
  xMin: number
  xMax: number
  seed: number
}

export type Sample = { x: number[]; y: number[] }

/**
 * Gera uma amostra com `x` equiespaçado em [xMin, xMax] e
 * `y = β₀ + β₁x + σ·z`, com `z ~ N(0,1)` vindo do PRNG com semente.
 *
 * Mesma semente e mesmos parâmetros ⇒ exatamente a mesma amostra.
 */
export function simulate(p: Params): Sample {
  const n = Math.max(1, Math.floor(p.n))
  const normal = makeNormal(mulberry32(p.seed))
  const passo = n > 1 ? (p.xMax - p.xMin) / (n - 1) : 0
  const x = new Array<number>(n)
  const y = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    const xi = n > 1 ? p.xMin + i * passo : (p.xMin + p.xMax) / 2
    x[i] = xi
    y[i] = p.beta0 + p.beta1 * xi + p.sigma * normal()
  }
  return { x, y }
}
