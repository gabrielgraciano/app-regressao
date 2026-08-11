import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { emvReducer, ESTADO_INICIAL, useEmvState } from './useEmvState'

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

describe('useEmvState', () => {
  it('mover o candidato não recalcula o que depende só da amostra', () => {
    const { result } = renderHook(() => useEmvState())
    const somas = result.current.derivado.somas
    const emv = result.current.derivado.emv
    const info = result.current.derivado.info
    const elipse = result.current.derivado.elipse

    act(() => {
      result.current.dispatch({ tipo: 'candidato', reta: { b0: 7, b1: -3 } })
    })

    // identidade preservada: o painel B não redesenha o heatmap ao arrastar
    expect(result.current.derivado.somas).toBe(somas)
    expect(result.current.derivado.emv).toBe(emv)
    expect(result.current.derivado.info).toBe(info)
    expect(result.current.derivado.elipse).toBe(elipse)
    // mas o que depende do candidato mudou
    expect(result.current.derivado.gap).toBeGreaterThan(0)
  })

  it('nova amostra recalcula tudo', () => {
    const { result } = renderHook(() => useEmvState())
    const somas = result.current.derivado.somas
    act(() => {
      result.current.dispatch({ tipo: 'novaAmostra' })
    })
    expect(result.current.derivado.somas).not.toBe(somas)
  })

  it('o gap é zero quando o candidato está no EMV', () => {
    const { result } = renderHook(() => useEmvState())
    const { b0, b1 } = result.current.derivado.emv
    act(() => {
      result.current.dispatch({ tipo: 'candidato', reta: { b0, b1 } })
    })
    expect(Math.abs(result.current.derivado.gap)).toBeLessThan(1e-9)
    expect(result.current.derivado.sigma2CandMle).toBeCloseTo(
      result.current.derivado.sigma2Emv,
      12,
    )
  })
})
