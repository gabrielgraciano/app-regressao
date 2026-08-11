/**
 * Domínios de eixo estáveis.
 *
 * Um eixo que se reajusta a cada quadro esconde justamente o que deveria
 * mostrar: se o domínio de y é recalculado a partir dos próprios yᵢ, mexer em
 * β₀ desloca dados e domínio pela mesma constante, e nada se move na tela —
 * só os rótulos dos ticks. Por isso o domínio aqui é *pegajoso*: só muda
 * quando o conteúdo não cabe mais, ou quando sobrou folga demais.
 *
 * Matemática pura — sem React, sem DOM.
 */

export type Intervalo = [number, number]

/**
 * Folga padrão do reenquadramento. É ela que dá ao conteúdo espaço para se
 * mover antes do próximo reajuste: com folga apertada o eixo reenquadra quase
 * a cada passo e o deslize volta.
 */
export const FOLGA_PADRAO = 0.3

/** Acrescenta uma folga proporcional dos dois lados. */
export function comFolga([lo, hi]: Intervalo, frac = FOLGA_PADRAO): Intervalo {
  const folga = (hi - lo) * frac || 1
  return [lo - folga, hi + folga]
}

/**
 * Decide o novo domínio a partir do atual e do intervalo que precisa caber.
 *
 * Devolve **a mesma referência** de `atual` quando nada precisa mudar — é o
 * que garante que deslocar a reta dentro da janela não rescale o eixo.
 */
export function ajustaDominio(
  atual: Intervalo | null,
  necessario: Intervalo,
  frac = FOLGA_PADRAO,
): Intervalo {
  if (!atual) return comFolga(necessario, frac)

  const [lo, hi] = necessario
  const cabe = lo >= atual[0] && hi <= atual[1]
  // Conteúdo muito menor que a janela: reenquadra para não ficar minúsculo.
  const folgadoDemais = hi - lo < 0.45 * (atual[1] - atual[0])

  return cabe && !folgadoDemais ? atual : comFolga(necessario, frac)
}

/** Menor intervalo que contém todos os valores finitos. */
export function extento(valores: number[]): Intervalo {
  let lo = Number.POSITIVE_INFINITY
  let hi = Number.NEGATIVE_INFINITY
  for (const v of valores) {
    if (!Number.isFinite(v)) continue
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  if (lo > hi) return [0, 1]
  return [lo, hi]
}
