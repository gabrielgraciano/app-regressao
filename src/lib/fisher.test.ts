import { describe, expect, it } from 'vitest'
import { block2x2, fisherInfo, invert3x3, mul3x3, standardErrors } from './fisher'
import { ols, sigma2Mle, sums } from './regression'
import { simulate } from './simulate'

const amostra = simulate({
  n: 30,
  beta0: 1.5,
  beta1: -0.8,
  sigma: 2,
  xMin: 0,
  xMax: 10,
  seed: 11,
})

describe('fisherInfo', () => {
  it('tem exatamente a forma do plano (§2)', () => {
    const sigma2 = 3
    const m = sums(amostra)
    const I = fisherInfo(amostra, sigma2)
    expect(I[0][0]).toBeCloseTo(m.n / sigma2, 12)
    expect(I[0][1]).toBeCloseTo(m.sx / sigma2, 12)
    expect(I[1][0]).toBeCloseTo(m.sx / sigma2, 12)
    expect(I[1][1]).toBeCloseTo(m.sxx / sigma2, 12)
    expect(I[2][2]).toBeCloseTo(m.n / (2 * sigma2 * sigma2), 12)
    // blocos cruzados β × σ² são nulos
    expect(I[0][2]).toBe(0)
    expect(I[1][2]).toBe(0)
    expect(I[2][0]).toBe(0)
    expect(I[2][1]).toBe(0)
  })
})

describe('invert3x3', () => {
  it('I⁻¹ · I = identidade (tolerância 1e-9)', () => {
    const { beta0, beta1 } = ols(amostra)
    const sigma2 = sigma2Mle(amostra, beta0, beta1)
    const I = fisherInfo(amostra, sigma2)
    const inv = invert3x3(I)
    const prod = mul3x3(inv, I)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(Math.abs(prod[i][j] - (i === j ? 1 : 0))).toBeLessThan(1e-9)
      }
    }
  })

  it('inverte uma matriz genérica não simétrica', () => {
    const m = [
      [2, -1, 0],
      [4, 3, 1],
      [-2, 5, 7],
    ]
    const prod = mul3x3(m, invert3x3(m))
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(Math.abs(prod[i][j] - (i === j ? 1 : 0))).toBeLessThan(1e-9)
      }
    }
  })

  it('devolve NaN quando a matriz é singular', () => {
    const singular = [
      [1, 2, 3],
      [2, 4, 6],
      [7, 8, 9],
    ]
    expect(Number.isNaN(invert3x3(singular)[0][0])).toBe(true)
  })
})

describe('standardErrors', () => {
  it('EP(β̂₁) coincide com a fórmula fechada √(σ²/Sxx)', () => {
    const { beta0, beta1 } = ols(amostra)
    const sigma2 = sigma2Mle(amostra, beta0, beta1)
    const inv = invert3x3(fisherInfo(amostra, sigma2))
    const { se1, seSigma2 } = standardErrors(inv)
    const m = sums(amostra)
    expect(se1).toBeCloseTo(Math.sqrt(sigma2 / m.Sxx), 9)
    // EP(σ̂²) = √(2σ⁴/n)
    expect(seSigma2).toBeCloseTo(Math.sqrt((2 * sigma2 * sigma2) / m.n), 9)
  })

  it('EP(β̂₀) coincide com √(σ²·(1/n + x̄²/Sxx))', () => {
    const { beta0, beta1 } = ols(amostra)
    const sigma2 = sigma2Mle(amostra, beta0, beta1)
    const inv = invert3x3(fisherInfo(amostra, sigma2))
    const { se0 } = standardErrors(inv)
    const m = sums(amostra)
    expect(se0).toBeCloseTo(
      Math.sqrt(sigma2 * (1 / m.n + (m.xbar * m.xbar) / m.Sxx)),
      9,
    )
  })
})

describe('block2x2', () => {
  it('extrai o bloco (β₀, β₁) de I⁻¹ e é simétrico', () => {
    const inv = invert3x3(fisherInfo(amostra, 1.7))
    const b = block2x2(inv)
    expect(b[0][1]).toBeCloseTo(b[1][0], 12)
    expect(b[0][0]).toBeCloseTo(inv[0][0], 12)
    expect(b[1][1]).toBeCloseTo(inv[1][1], 12)
  })
})
