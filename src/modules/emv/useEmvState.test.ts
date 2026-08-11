import { describe, expect, it } from 'vitest'
import { emvReducer, ESTADO_INICIAL } from './useEmvState'

describe('emvReducer', () => {
  it('altera um parâmetro sem tocar no resto do estado', () => {
    const novo = emvReducer(ESTADO_INICIAL, {
      tipo: 'param',
      chave: 'n',
      valor: 120,
    })
    expect(novo.params.n).toBe(120)
    expect(novo.params.seed).toBe(ESTADO_INICIAL.params.seed)
    expect(novo.candidato).toEqual(ESTADO_INICIAL.candidato)
  })

  it('impede xMax ≤ xMin', () => {
    const novo = emvReducer(ESTADO_INICIAL, {
      tipo: 'param',
      chave: 'xMin',
      valor: 20,
    })
    expect(novo.params.xMax).toBeGreaterThan(novo.params.xMin)
  })

  it('nova amostra troca a semente e zera a revelação', () => {
    const revelado = { ...ESTADO_INICIAL, revelado: true }
    const novo = emvReducer(revelado, { tipo: 'novaAmostra' })
    expect(novo.params.seed).toBe(ESTADO_INICIAL.params.seed + 1)
    expect(novo.revelado).toBe(false)
  })

  it('atualiza a reta candidata parcialmente', () => {
    const novo = emvReducer(ESTADO_INICIAL, {
      tipo: 'candidato',
      reta: { b1: 3 },
    })
    expect(novo.candidato.b1).toBe(3)
    expect(novo.candidato.b0).toBe(ESTADO_INICIAL.candidato.b0)
  })

  it('σ² manual pode ser fixado e devolvido ao automático', () => {
    const fixo = emvReducer(ESTADO_INICIAL, { tipo: 'sigma2', valor: 7 })
    expect(fixo.sigma2Manual).toBe(7)
    expect(emvReducer(fixo, { tipo: 'sigma2', valor: null }).sigma2Manual).toBe(
      null,
    )
  })

  it('modo desafio esconde a solução até revelar', () => {
    const desafio = emvReducer(ESTADO_INICIAL, {
      tipo: 'modoDesafio',
      ligado: true,
    })
    expect(desafio.modoDesafio).toBe(true)
    expect(desafio.revelado).toBe(false)
    expect(emvReducer(desafio, { tipo: 'revelar' }).revelado).toBe(true)
  })
})
