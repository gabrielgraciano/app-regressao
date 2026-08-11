/**
 * Formatação numérica para a interface (funções puras, sem React/DOM).
 */

/** Número com casas decimais fixas e sinal de menos tipográfico. */
export function num(v: number, casas = 3): string {
  if (!Number.isFinite(v)) return '—'
  const s = v.toFixed(casas)
  // evita "-0.000"
  const limpo = Number(s) === 0 ? (0).toFixed(casas) : s
  return limpo.replace('-', '−')
}

/** Notação compacta: usa notação científica quando o valor é muito grande/pequeno. */
export function numCompacto(v: number, casas = 3): string {
  if (!Number.isFinite(v)) return '—'
  const a = Math.abs(v)
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) {
    return v.toExponential(2).replace('-', '−').replace('e', '×10^')
  }
  return num(v, casas)
}

/** Mesma coisa, porém em LaTeX (para dentro de fórmulas KaTeX). */
export function numTex(v: number, casas = 3): string {
  if (!Number.isFinite(v)) return '\\text{—}'
  const a = Math.abs(v)
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) {
    const [m, e] = v.toExponential(2).split('e')
    return `${m} \\times 10^{${Number(e)}}`
  }
  return v.toFixed(casas)
}
