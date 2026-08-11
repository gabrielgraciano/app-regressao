import { describe, expect, it } from 'vitest'
import { marchingSquares } from './contours'
import { viridis, viridisCss } from './colormap'

describe('marchingSquares', () => {
  it('não devolve segmentos quando a grade toda está de um lado do nível', () => {
    const v = new Float64Array([1, 1, 1, 1])
    expect(marchingSquares(v, 2, 2, 5)).toHaveLength(0)
    expect(marchingSquares(v, 2, 2, -5)).toHaveLength(0)
  })

  it('acha o meio de uma rampa linear', () => {
    // rampa em coluna: 0 e 2 → nível 1 cruza exatamente no meio
    const v = new Float64Array([0, 2, 0, 2])
    const segs = marchingSquares(v, 2, 2, 1)
    expect(segs).toHaveLength(1)
    const [x1, , x2] = segs[0]
    expect(x1).toBeCloseTo(0.5, 10)
    expect(x2).toBeCloseTo(0.5, 10)
  })

  it('produz uma curva fechada em torno do máximo de um paraboloide', () => {
    const n = 41
    const v = new Float64Array(n * n)
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const x = (i - 20) / 10
        const y = (j - 20) / 10
        v[j * n + i] = -(x * x + y * y)
      }
    }
    const segs = marchingSquares(v, n, n, -1)
    expect(segs.length).toBeGreaterThan(20)
    // todos os pontos ficam a distância ≈ 1 do centro (raio de −(x²+y²) = −1)
    for (const [c1, l1] of segs) {
      const x = (c1 - 20) / 10
      const y = (l1 - 20) / 10
      expect(Math.hypot(x, y)).toBeGreaterThan(0.9)
      expect(Math.hypot(x, y)).toBeLessThan(1.1)
    }
  })
})

describe('viridis', () => {
  it('vai do roxo escuro ao amarelo', () => {
    expect(viridis(0)).toEqual([68, 1, 84])
    expect(viridis(1)).toEqual([253, 231, 37])
  })

  it('trunca valores fora de [0,1] e devolve css válido', () => {
    expect(viridis(-3)).toEqual(viridis(0))
    expect(viridis(9)).toEqual(viridis(1))
    expect(viridisCss(0.5)).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })
})
