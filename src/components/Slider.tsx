import { useId } from 'react'
import { Formula } from './Formula'
import { num } from '../lib/format'

type Props = {
  /** Rótulo em texto. */
  rotulo: string
  /** Símbolo matemático correspondente (LaTeX), opcional. */
  simbolo?: string
  valor: number
  min: number
  max: number
  passo: number
  casas?: number
  legenda?: string
  onChange: (v: number) => void
}

/** Controle deslizante com rótulo, símbolo e leitura do valor. */
export function Slider({
  rotulo,
  simbolo,
  valor,
  min,
  max,
  passo,
  casas = 2,
  legenda,
  onChange,
}: Props) {
  const id = useId()
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {simbolo ? (
            <>
              <Formula tex={simbolo} />{' '}
              <span className="text-slate-500">— {rotulo}</span>
            </>
          ) : (
            rotulo
          )}
        </label>
        <output
          htmlFor={id}
          className="font-mono text-sm tabular-nums text-slate-900"
        >
          {num(valor, casas)}
        </output>
      </div>
      <input
        id={id}
        data-teste={rotulo}
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="mt-1 w-full accent-sky-600"
      />
      {legenda ? (
        <p className="mt-0.5 text-xs leading-snug text-slate-500">{legenda}</p>
      ) : null}
    </div>
  )
}
