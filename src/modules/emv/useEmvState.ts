import { useMemo, useReducer } from 'react'
import { simulate, type Params, type Sample } from '../../lib/simulate'
import {
  logLik,
  ols,
  rss,
  s2Unbiased,
  sigma2Mle,
  sums,
  type Sums,
} from '../../lib/regression'
import {
  block2x2,
  fisherInfo,
  invert3x3,
  standardErrors,
  type Mat3,
} from '../../lib/fisher'
import { confidenceEllipse } from '../../lib/ellipse'

export type Reta = { b0: number; b1: number }

export type EmvState = {
  params: Params
  /** Reta candidata que o aluno arrasta. */
  candidato: Reta
  /**
   * σ² escolhido à mão no painel C. `null` significa "acompanha o
   * σ̂²(β₀ᶜ, β₁ᶜ) = SQRes/n do candidato".
   */
  sigma2Manual: number | null
  modoDesafio: boolean
  /** No modo desafio, revela a solução depois de o aluno tentar. */
  revelado: boolean
}

export type EmvAction =
  | { tipo: 'param'; chave: keyof Params; valor: number }
  | { tipo: 'candidato'; reta: Partial<Reta> }
  | { tipo: 'sigma2'; valor: number | null }
  | { tipo: 'novaAmostra' }
  | { tipo: 'modoDesafio'; ligado: boolean }
  | { tipo: 'revelar' }

export const PARAMS_INICIAIS: Params = {
  n: 40,
  beta0: 2,
  beta1: 1.5,
  sigma: 2,
  xMin: 0,
  xMax: 10,
  seed: 42,
}

export const ESTADO_INICIAL: EmvState = {
  params: PARAMS_INICIAIS,
  // começa na reta verdadeira: ela não é o EMV, e ver essa diferença é o ponto
  candidato: { b0: PARAMS_INICIAIS.beta0, b1: PARAMS_INICIAIS.beta1 },
  sigma2Manual: null,
  modoDesafio: false,
  revelado: false,
}

export function emvReducer(estado: EmvState, acao: EmvAction): EmvState {
  switch (acao.tipo) {
    case 'param': {
      const params = { ...estado.params, [acao.chave]: acao.valor }
      if (params.xMax <= params.xMin) params.xMax = params.xMin + 1
      return { ...estado, params }
    }
    case 'candidato':
      return { ...estado, candidato: { ...estado.candidato, ...acao.reta } }
    case 'sigma2':
      return { ...estado, sigma2Manual: acao.valor }
    case 'novaAmostra':
      return {
        ...estado,
        params: { ...estado.params, seed: estado.params.seed + 1 },
        revelado: false,
      }
    case 'modoDesafio':
      return { ...estado, modoDesafio: acao.ligado, revelado: false }
    case 'revelar':
      return { ...estado, revelado: true }
    default:
      return estado
  }
}

export type EmvDerivado = {
  amostra: Sample
  somas: Sums
  /** EMV analítico de (β₀, β₁). */
  emv: Reta
  sqResEmv: number
  sigma2Emv: number
  s2: number
  logLikEmv: number
  /** Valores no candidato. */
  sqResCand: number
  sigma2CandMle: number
  s2Cand: number
  /** σ² efetivamente usado no painel C e em ℓ(candidato). */
  sigma2Ativo: number
  logLikCand: number
  /** ℓ(θ̂) − ℓ(candidato) ≥ 0. */
  gap: number
  info: Mat3
  infoInv: Mat3
  se: { se0: number; se1: number; seSigma2: number }
  elipse: [number, number][]
}

/** Estado do módulo EMV: parâmetros, reta candidata e tudo o que deriva deles. */
export function useEmvState() {
  const [estado, dispatch] = useReducer(emvReducer, ESTADO_INICIAL)

  const amostra = useMemo(() => simulate(estado.params), [estado.params])

  const derivado = useMemo<EmvDerivado>(() => {
    const somas = sums(amostra)
    const emv = ols(amostra)
    const sqResEmv = rss(amostra, emv.beta0, emv.beta1)
    const sigma2Emv = sigma2Mle(amostra, emv.beta0, emv.beta1)
    const s2 = s2Unbiased(amostra, emv.beta0, emv.beta1)
    const logLikEmv = logLik(amostra, emv.beta0, emv.beta1, sigma2Emv)

    const { b0, b1 } = estado.candidato
    const sqResCand = rss(amostra, b0, b1)
    const sigma2CandMle = sigma2Mle(amostra, b0, b1)
    const s2Cand = s2Unbiased(amostra, b0, b1)
    const sigma2Ativo =
      estado.sigma2Manual !== null
        ? estado.sigma2Manual
        : Math.max(sigma2CandMle, 1e-12)
    const logLikCand = logLik(amostra, b0, b1, sigma2Ativo)

    const info = fisherInfo(amostra, sigma2Emv)
    const infoInv = invert3x3(info)
    const se = standardErrors(infoInv)
    const elipse = confidenceEllipse(
      block2x2(infoInv),
      [emv.beta0, emv.beta1],
      0.95,
      96,
    )

    return {
      amostra,
      somas,
      emv: { b0: emv.beta0, b1: emv.beta1 },
      sqResEmv,
      sigma2Emv,
      s2,
      logLikEmv,
      sqResCand,
      sigma2CandMle,
      s2Cand,
      sigma2Ativo,
      logLikCand,
      gap: logLikEmv - logLikCand,
      info,
      infoInv,
      se,
      elipse,
    }
  }, [amostra, estado.candidato, estado.sigma2Manual])

  return { estado, dispatch, derivado }
}
