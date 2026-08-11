import type { ReactNode } from 'react'
import { Formula } from './Formula'
import { numCompacto } from '../lib/format'

type Props = {
  /** Símbolo da fórmula, em LaTeX (ex.: `\hat\beta_1`). */
  simbolo: string
  valor: number | string
  casas?: number
  legenda?: ReactNode
  /** Destaca o cartão (usado no EMV e no placar do modo desafio). */
  destaque?: 'nenhum' | 'emv' | 'candidato' | 'alerta'
}

const cores: Record<NonNullable<Props['destaque']>, string> = {
  nenhum: 'border-slate-200 bg-white',
  emv: 'border-emerald-200 bg-emerald-50',
  candidato: 'border-sky-200 bg-sky-50',
  alerta: 'border-amber-200 bg-amber-50',
}

/**
 * Mostra um número com o símbolo da fórmula ao lado — nenhum número na tela
 * sem rótulo e sem símbolo correspondente (PLANO §6).
 */
export function Readout({
  simbolo,
  valor,
  casas = 3,
  legenda,
  destaque = 'nenhum',
}: Props) {
  const texto = typeof valor === 'number' ? numCompacto(valor, casas) : valor
  return (
    <div className={`rounded-lg border px-3 py-2 ${cores[destaque]}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-slate-700">
          <Formula tex={simbolo} />
        </span>
        <span className="font-mono text-sm tabular-nums font-semibold text-slate-900">
          {texto}
        </span>
      </div>
      {legenda ? (
        <p className="mt-1 text-xs leading-snug text-slate-500">{legenda}</p>
      ) : null}
    </div>
  )
}
