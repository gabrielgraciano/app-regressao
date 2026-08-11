import { useMemo } from 'react'
import { scaleLinear } from 'd3-scale'
import { Panel } from '../../components/Panel'
import { Formula } from '../../components/Formula'
import { logLik } from '../../lib/regression'
import { num } from '../../lib/format'
import type { EmvAction, EmvDerivado, EmvState } from './useEmvState'

const W = 660
const H = 300
const M = { top: 16, right: 18, bottom: 42, left: 64 }
const PONTOS = 220

type Props = {
  estado: EmvState
  dispatch: (a: EmvAction) => void
  derivado: EmvDerivado
}

/** Painel C — perfil de ℓ em σ², com (β₀, β₁) fixos no candidato. */
export function PainelC({ estado, dispatch, derivado }: Props) {
  const { amostra, sigma2CandMle, sigma2Ativo, logLikCand } = derivado
  const { b0, b1 } = estado.candidato

  const { curva, ex, ey, s2Min, s2Max } = useMemo(() => {
    const centro = Math.max(sigma2CandMle, 1e-9)
    const min = Math.max(centro * 0.1, 1e-9)
    const max = Math.max(centro * 4, sigma2Ativo * 1.1, min * 2)
    const pts: [number, number][] = []
    for (let k = 0; k < PONTOS; k++) {
      const s2 = min + ((max - min) * k) / (PONTOS - 1)
      pts.push([s2, logLik(amostra, b0, b1, s2)])
    }
    const ys = pts.map((d) => d[1]).filter(Number.isFinite)
    const yMax = Math.max(...ys)
    const yMin = Math.max(Math.min(...ys), yMax - 6 * Math.abs(yMax / 10) - 20)
    return {
      curva: pts,
      s2Min: min,
      s2Max: max,
      ex: scaleLinear()
        .domain([min, max])
        .range([M.left, W - M.right]),
      ey: scaleLinear()
        .domain([yMin, yMax + (yMax - yMin) * 0.08])
        .range([H - M.bottom, M.top]),
    }
  }, [amostra, b0, b1, sigma2CandMle, sigma2Ativo])

  const caminho = curva
    .filter(([, l]) => Number.isFinite(l) && l >= ey.domain()[0])
    .map(([s2, l], i) => `${i === 0 ? 'M' : 'L'} ${ex(s2)} ${ey(l)}`)
    .join(' ')

  const passo = (s2Max - s2Min) / 200

  return (
    <Panel
      titulo="C. Perfil em σ²"
      descricao={
        <>
          Com (β₀ᶜ, β₁ᶜ) <strong>fixos no candidato</strong>, esta é ℓ como
          função de σ². O máximo cai exatamente em σ̂² = SQRes/n — a linha
          tracejada verde. Mexa no slider e veja ℓ cair dos dois lados.
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Log-verossimilhança em função de sigma ao quadrado"
      >
        <rect
          x={M.left}
          y={M.top}
          width={W - M.left - M.right}
          height={H - M.top - M.bottom}
          className="fill-slate-50 stroke-slate-200"
        />
        {ex.ticks(6).map((t) => (
          <g key={`x${t}`}>
            <line
              x1={ex(t)}
              x2={ex(t)}
              y1={M.top}
              y2={H - M.bottom}
              className="stroke-slate-200"
            />
            <text
              x={ex(t)}
              y={H - M.bottom + 16}
              textAnchor="middle"
              className="fill-slate-500 text-[11px]"
            >
              {num(t, 2)}
            </text>
          </g>
        ))}
        {ey.ticks(5).map((t) => (
          <g key={`y${t}`}>
            <line
              x1={M.left}
              x2={W - M.right}
              y1={ey(t)}
              y2={ey(t)}
              className="stroke-slate-200"
            />
            <text
              x={M.left - 8}
              y={ey(t) + 4}
              textAnchor="end"
              className="fill-slate-500 text-[11px]"
            >
              {num(t, 1)}
            </text>
          </g>
        ))}

        <path d={caminho} fill="none" stroke="#7c3aed" strokeWidth={2.5} />

        {/* máximo em σ̂² = SQRes/n */}
        {sigma2CandMle >= s2Min && sigma2CandMle <= s2Max && (
          <>
            <line
              x1={ex(sigma2CandMle)}
              x2={ex(sigma2CandMle)}
              y1={M.top}
              y2={H - M.bottom}
              stroke="#059669"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <text
              x={ex(sigma2CandMle) + 6}
              y={M.top + 14}
              className="fill-emerald-700 text-[11px]"
            >
              σ̂² = SQRes/n = {num(sigma2CandMle, 3)}
            </text>
          </>
        )}

        {/* σ² atualmente em uso */}
        {sigma2Ativo >= s2Min && sigma2Ativo <= s2Max && (
          <circle
            cx={ex(sigma2Ativo)}
            cy={ey(logLikCand)}
            r={6}
            fill="#0284c7"
            stroke="#fff"
            strokeWidth={2}
          />
        )}

        <text
          x={(M.left + W - M.right) / 2}
          y={H - 8}
          textAnchor="middle"
          className="fill-slate-600 text-[12px]"
        >
          σ²
        </text>
        <text
          x={16}
          y={(M.top + H - M.bottom) / 2}
          textAnchor="middle"
          transform={`rotate(-90 16 ${(M.top + H - M.bottom) / 2})`}
          className="fill-slate-600 text-[12px]"
        >
          ℓ(β₀ᶜ, β₁ᶜ, σ²)
        </text>
      </svg>

      <div className="mt-2">
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor="slider-sigma2"
            className="text-sm font-medium text-slate-700"
          >
            <Formula tex="\sigma^2" />{' '}
            <span className="text-slate-500">— variância usada em ℓ</span>
          </label>
          <output
            htmlFor="slider-sigma2"
            className="font-mono text-sm tabular-nums"
          >
            {num(sigma2Ativo, 3)}
          </output>
        </div>
        <input
          id="slider-sigma2"
          type="range"
          min={s2Min}
          max={s2Max}
          step={passo}
          value={Math.min(Math.max(sigma2Ativo, s2Min), s2Max)}
          onChange={(e) =>
            dispatch({ tipo: 'sigma2', valor: Number(e.currentTarget.value) })
          }
          className="mt-1 w-full accent-violet-600"
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            {estado.sigma2Manual === null
              ? 'σ² está acompanhando automaticamente σ̂²(β₀ᶜ, β₁ᶜ).'
              : 'σ² fixado à mão — ℓ fica abaixo do máximo do perfil.'}
          </p>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => dispatch({ tipo: 'sigma2', valor: null })}
          >
            Voltar a σ̂²
          </button>
        </div>
      </div>
    </Panel>
  )
}
