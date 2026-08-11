/**
 * Regressão linear simples: somas, mínimos quadrados / EMV,
 * soma de quadrados dos resíduos e log-verossimilhança.
 *
 * Matemática pura — sem React, sem DOM.
 */

import type { Sample } from './simulate'

export type Sums = {
  n: number
  sx: number
  sy: number
  sxx: number
  syy: number
  sxy: number
  xbar: number
  ybar: number
  /** Sxx = Σ(xᵢ − x̄)² */
  Sxx: number
  /** Sxy = Σ(xᵢ − x̄)(yᵢ − ȳ) */
  Sxy: number
}

/** Somas suficientes da amostra. */
export function sums(s: Sample): Sums {
  const n = s.x.length
  let sx = 0
  let sy = 0
  let sxx = 0
  let syy = 0
  let sxy = 0
  for (let i = 0; i < n; i++) {
    sx += s.x[i]
    sy += s.y[i]
    sxx += s.x[i] * s.x[i]
    syy += s.y[i] * s.y[i]
    sxy += s.x[i] * s.y[i]
  }
  const xbar = n > 0 ? sx / n : 0
  const ybar = n > 0 ? sy / n : 0
  return {
    n,
    sx,
    sy,
    sxx,
    syy,
    sxy,
    xbar,
    ybar,
    Sxx: sxx - n * xbar * xbar,
    Sxy: sxy - n * xbar * ybar,
  }
}

/**
 * Estimadores de máxima verossimilhança de (β₀, β₁) — que aqui coincidem com
 * os de mínimos quadrados: β̂₁ = Sxy/Sxx e β̂₀ = ȳ − β̂₁x̄.
 */
export function ols(s: Sample): { beta0: number; beta1: number } {
  const m = sums(s)
  const beta1 = m.Sxx !== 0 ? m.Sxy / m.Sxx : 0
  const beta0 = m.ybar - beta1 * m.xbar
  return { beta0, beta1 }
}

/** Valores ajustados pela reta (b0, b1). */
export function predict(x: number[], b0: number, b1: number): number[] {
  return x.map((xi) => b0 + b1 * xi)
}

/** Resíduos eᵢ = yᵢ − b₀ − b₁xᵢ. */
export function residuals(s: Sample, b0: number, b1: number): number[] {
  return s.x.map((xi, i) => s.y[i] - b0 - b1 * xi)
}

/** SQRes = Σ(yᵢ − b₀ − b₁xᵢ)². */
export function rss(s: Sample, b0: number, b1: number): number {
  let acc = 0
  for (let i = 0; i < s.x.length; i++) {
    const e = s.y[i] - b0 - b1 * s.x[i]
    acc += e * e
  }
  return acc
}

/**
 * SQRes calculado só com as somas suficientes, em tempo constante:
 *
 *   SQRes = Σy² − 2b₀Σy − 2b₁Σxy + n·b₀² + 2b₀b₁Σx + b₁²Σx²
 *
 * É o que permite varrer uma grade de 120×120 retas candidatas no painel B
 * sem percorrer a amostra inteira em cada ponto.
 */
export function rssFromSums(m: Sums, b0: number, b1: number): number {
  return Math.max(
    0,
    m.syy -
      2 * b0 * m.sy -
      2 * b1 * m.sxy +
      m.n * b0 * b0 +
      2 * b0 * b1 * m.sx +
      b1 * b1 * m.sxx,
  )
}

/**
 * Log-verossimilhança do modelo normal:
 *
 *   ℓ(β₀, β₁, σ²) = −(n/2)log(2π) − (n/2)log(σ²) − (1/(2σ²))·Σ(yᵢ − β₀ − β₁xᵢ)²
 */
export function logLik(
  s: Sample,
  b0: number,
  b1: number,
  sigma2: number,
): number {
  const n = s.x.length
  if (!(sigma2 > 0)) return Number.NEGATIVE_INFINITY
  return (
    -(n / 2) * Math.log(2 * Math.PI) -
    (n / 2) * Math.log(sigma2) -
    rss(s, b0, b1) / (2 * sigma2)
  )
}

/**
 * Log-verossimilhança perfilada em σ²: substitui σ² por σ̂²(β₀,β₁) = SQRes/n.
 * É o que o painel B desenha no plano (β₀, β₁).
 */
export function profileLogLik(s: Sample, b0: number, b1: number): number {
  const n = s.x.length
  const sigma2 = rss(s, b0, b1) / n
  if (!(sigma2 > 0)) return Number.POSITIVE_INFINITY
  return -(n / 2) * (Math.log(2 * Math.PI) + Math.log(sigma2) + 1)
}

/** EMV de σ²: σ̂²_EMV = SQRes/n (viesado). */
export function sigma2Mle(s: Sample, b0: number, b1: number): number {
  const n = s.x.length
  return n > 0 ? rss(s, b0, b1) / n : 0
}

/** Estimador não viesado: s² = SQRes/(n − 2). */
export function s2Unbiased(s: Sample, b0: number, b1: number): number {
  const n = s.x.length
  return n > 2 ? rss(s, b0, b1) / (n - 2) : Number.NaN
}
