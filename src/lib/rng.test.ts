import { describe, expect, it } from 'vitest'
import { makeNormal, mulberry32 } from './rng'
import { simulate, type Params } from './simulate'

const base: Params = {
  n: 50,
  beta0: 1,
  beta1: 2,
  sigma: 1.5,
  xMin: 0,
  xMax: 10,
  seed: 42,
}

describe('mulberry32', () => {
  it('gera uniformes em [0,1)', () => {
    const rand = mulberry32(123)
    for (let i = 0; i < 1000; i++) {
      const u = rand()
      expect(u).toBeGreaterThanOrEqual(0)
      expect(u).toBeLessThan(1)
    }
  })

  it('é determinístico para a mesma semente e difere entre sementes', () => {
    const a = mulberry32(7)
    const b = mulberry32(7)
    const c = mulberry32(8)
    const va = Array.from({ length: 10 }, a)
    const vb = Array.from({ length: 10 }, b)
    const vc = Array.from({ length: 10 }, c)
    expect(va).toEqual(vb)
    expect(va).not.toEqual(vc)
  })
})

describe('makeNormal (Box–Muller)', () => {
  it('tem média ≈ 0 e variância ≈ 1', () => {
    const normal = makeNormal(mulberry32(2026))
    const n = 20000
    let soma = 0
    let soma2 = 0
    for (let i = 0; i < n; i++) {
      const z = normal()
      soma += z
      soma2 += z * z
    }
    const media = soma / n
    const variancia = soma2 / n - media * media
    expect(Math.abs(media)).toBeLessThan(0.05)
    expect(Math.abs(variancia - 1)).toBeLessThan(0.05)
  })
})

describe('simulate', () => {
  it('devolve exatamente a mesma amostra para a mesma semente', () => {
    const a = simulate(base)
    const b = simulate(base)
    expect(a.x).toEqual(b.x)
    expect(a.y).toEqual(b.y)
  })

  it('muda a amostra quando a semente muda', () => {
    const a = simulate(base)
    const b = simulate({ ...base, seed: 43 })
    expect(a.x).toEqual(b.x) // o desenho em x não depende da semente
    expect(a.y).not.toEqual(b.y)
  })

  it('põe x equiespaçado cobrindo [xMin, xMax]', () => {
    const s = simulate({ ...base, n: 5, xMin: 2, xMax: 6 })
    expect(s.x).toEqual([2, 3, 4, 5, 6])
    expect(s.y).toHaveLength(5)
  })
})
