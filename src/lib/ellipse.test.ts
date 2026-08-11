import { describe, expect, it } from 'vitest'
import { chi2Quantile2gl, confidenceEllipse, eigenSym2x2 } from './ellipse'

describe('chi2Quantile2gl', () => {
  it('vale ≈ 5.991 no nível 95%', () => {
    expect(chi2Quantile2gl(0.95)).toBeCloseTo(5.9914645, 6)
  })
})

describe('eigenSym2x2', () => {
  it('decompõe uma matriz diagonal', () => {
    const e = eigenSym2x2([
      [4, 0],
      [0, 1],
    ])
    expect(e.lambda1).toBeCloseTo(4, 12)
    expect(e.lambda2).toBeCloseTo(1, 12)
  })

  it('devolve autovetores ortonormais e satisfaz A·v = λ·v', () => {
    const A = [
      [2, 0.8],
      [0.8, 1],
    ]
    const { lambda1, v1, v2 } = eigenSym2x2(A)
    expect(Math.hypot(v1[0], v1[1])).toBeCloseTo(1, 12)
    expect(v1[0] * v2[0] + v1[1] * v2[1]).toBeCloseTo(0, 12)
    const Av = [A[0][0] * v1[0] + A[0][1] * v1[1], A[1][0] * v1[0] + A[1][1] * v1[1]]
    expect(Av[0]).toBeCloseTo(lambda1 * v1[0], 10)
    expect(Av[1]).toBeCloseTo(lambda1 * v1[1], 10)
  })
})

describe('confidenceEllipse', () => {
  const Sigma = [
    [4, 1.2],
    [1.2, 1],
  ]
  const centro: [number, number] = [3, -2]

  it('devolve o número pedido de pontos', () => {
    expect(confidenceEllipse(Sigma, centro, 0.95, 64)).toHaveLength(64)
  })

  it('todos os pontos satisfazem a forma quadrática = c', () => {
    const c = chi2Quantile2gl(0.95)
    // inversa 2×2 de Sigma
    const det = Sigma[0][0] * Sigma[1][1] - Sigma[0][1] * Sigma[1][0]
    const inv = [
      [Sigma[1][1] / det, -Sigma[0][1] / det],
      [-Sigma[1][0] / det, Sigma[0][0] / det],
    ]
    for (const [b0, b1] of confidenceEllipse(Sigma, centro, 0.95, 40)) {
      const d0 = b0 - centro[0]
      const d1 = b1 - centro[1]
      const q =
        d0 * (inv[0][0] * d0 + inv[0][1] * d1) +
        d1 * (inv[1][0] * d0 + inv[1][1] * d1)
      expect(q).toBeCloseTo(c, 8)
    }
  })

  it('para covariância isotrópica vira um círculo de raio √(c·σ²)', () => {
    const raio = Math.sqrt(chi2Quantile2gl(0.95) * 2)
    for (const [b0, b1] of confidenceEllipse(
      [
        [2, 0],
        [0, 2],
      ],
      [0, 0],
      0.95,
      32,
    )) {
      expect(Math.hypot(b0, b1)).toBeCloseTo(raio, 10)
    }
  })

  it('cresce com o nível de confiança', () => {
    const p95 = confidenceEllipse(Sigma, [0, 0], 0.95, 8)
    const p50 = confidenceEllipse(Sigma, [0, 0], 0.5, 8)
    expect(Math.hypot(p95[0][0], p95[0][1])).toBeGreaterThan(
      Math.hypot(p50[0][0], p50[0][1]),
    )
  })
})
