import { describe, expect, it } from 'vitest'
import {
  logLik,
  ols,
  profileLogLik,
  rss,
  s2Unbiased,
  sigma2Mle,
  sums,
} from './regression'
import { simulate } from './simulate'
import { mulberry32 } from './rng'

describe('ols', () => {
  it('reproduz um conjunto pequeno calculado à mão', () => {
    // x = [1,2,3,4], y = [2,4,5,8]
    // x̄ = 2.5, ȳ = 4.75, Sxx = 5, Sxy = 9.5 → β̂₁ = 1.9, β̂₀ = 0
    const s = { x: [1, 2, 3, 4], y: [2, 4, 5, 8] }
    const m = sums(s)
    expect(m.xbar).toBeCloseTo(2.5, 12)
    expect(m.ybar).toBeCloseTo(4.75, 12)
    expect(m.Sxx).toBeCloseTo(5, 12)
    expect(m.Sxy).toBeCloseTo(9.5, 12)

    const { beta0, beta1 } = ols(s)
    expect(beta1).toBeCloseTo(1.9, 12)
    expect(beta0).toBeCloseTo(4.75 - 1.9 * 2.5, 12)
    expect(beta0).toBeCloseTo(0, 12)
  })

  it('recupera exatamente uma reta sem erro', () => {
    const s = { x: [0, 1, 2, 3, 4], y: [3, 5, 7, 9, 11] }
    const { beta0, beta1 } = ols(s)
    expect(beta0).toBeCloseTo(3, 12)
    expect(beta1).toBeCloseTo(2, 12)
    expect(rss(s, beta0, beta1)).toBeCloseTo(0, 12)
  })
})

describe('logLik', () => {
  it('é máxima no EMV (β̂₀, β̂₁, σ̂²_EMV) sob perturbações aleatórias', () => {
    const s = simulate({
      n: 40,
      beta0: 2,
      beta1: -1.5,
      sigma: 1.2,
      xMin: 0,
      xMax: 10,
      seed: 42,
    })
    const { beta0, beta1 } = ols(s)
    const sigma2 = sigma2Mle(s, beta0, beta1)
    const lMax = logLik(s, beta0, beta1, sigma2)

    const rand = mulberry32(7)
    for (let k = 0; k < 20; k++) {
      // perturbações não nulas em cada coordenada
      const d0 = (rand() - 0.5) * 2
      const d1 = (rand() - 0.5) * 0.6
      const fator = 0.3 + rand() * 2 // multiplica σ²
      const alvo = logLik(
        s,
        beta0 + d0,
        beta1 + d1,
        Math.max(1e-6, sigma2 * fator),
      )
      expect(alvo).toBeLessThan(lMax)
    }
  })

  it('bate com a fórmula avaliada à mão', () => {
    const s = { x: [1, 2, 3, 4], y: [2, 4, 5, 8] }
    const n = 4
    const sigma2 = 2
    const sq = rss(s, 0, 1.9)
    const esperado =
      -(n / 2) * Math.log(2 * Math.PI) -
      (n / 2) * Math.log(sigma2) -
      sq / (2 * sigma2)
    expect(logLik(s, 0, 1.9, sigma2)).toBeCloseTo(esperado, 12)
  })

  it('a log-verossimilhança perfilada coincide com ℓ avaliada em σ̂²(β₀,β₁)', () => {
    const s = simulate({
      n: 25,
      beta0: 1,
      beta1: 0.7,
      sigma: 2,
      xMin: -3,
      xMax: 3,
      seed: 99,
    })
    const b0 = 0.4
    const b1 = 1.1
    expect(profileLogLik(s, b0, b1)).toBeCloseTo(
      logLik(s, b0, b1, sigma2Mle(s, b0, b1)),
      10,
    )
  })
})

describe('σ̂²_EMV versus s²', () => {
  it('sigma2Mle = s2Unbiased × (n−2)/n', () => {
    const s = simulate({
      n: 31,
      beta0: -1,
      beta1: 2.4,
      sigma: 0.8,
      xMin: 1,
      xMax: 9,
      seed: 2024,
    })
    const { beta0, beta1 } = ols(s)
    const n = s.x.length
    expect(sigma2Mle(s, beta0, beta1)).toBeCloseTo(
      (s2Unbiased(s, beta0, beta1) * (n - 2)) / n,
      12,
    )
    // o EMV é sempre menor: é o viés para baixo que a turma precisa ver
    expect(sigma2Mle(s, beta0, beta1)).toBeLessThan(s2Unbiased(s, beta0, beta1))
  })
})
