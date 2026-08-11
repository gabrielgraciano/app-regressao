import { useCallback, useMemo, useRef } from 'react'
import { scaleLinear } from 'd3-scale'
import { Panel } from '../../components/Panel'
import { num } from '../../lib/format'
import type { EmvAction, EmvDerivado, EmvState } from './useEmvState'

const W = 660
const H = 440
const M = { top: 16, right: 18, bottom: 42, left: 56 }

type Props = {
  estado: EmvState
  dispatch: (a: EmvAction) => void
  derivado: EmvDerivado
  escondeEmv: boolean
}

/** Painel A — dispersão com reta candidata arrastável e resíduos. */
export function PainelA({ estado, dispatch, derivado, escondeEmv }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const arrastando = useRef<'intercepto' | 'inclinacao' | null>(null)
  const { amostra, somas, emv } = derivado
  const { b0, b1 } = estado.candidato
  const p = estado.params

  const { ex, ey } = useMemo(() => {
    const xs = amostra.x
    const ys = amostra.y
    const x0 = Math.min(...xs)
    const x1 = Math.max(...xs)
    const folgaX = (x1 - x0) * 0.05 || 1
    let y0 = Math.min(...ys)
    let y1 = Math.max(...ys)
    const folgaY = (y1 - y0) * 0.12 || 1
    y0 -= folgaY
    y1 += folgaY
    return {
      ex: scaleLinear()
        .domain([x0 - folgaX, x1 + folgaX])
        .range([M.left, W - M.right]),
      ey: scaleLinear()
        .domain([y0, y1])
        .range([H - M.bottom, M.top]),
    }
  }, [amostra])

  const dominioX = ex.domain()
  const dominioY = ey.domain()

  /** Converte coordenadas do ponteiro para o sistema do gráfico. */
  const paraDados = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return null
      const r = svg.getBoundingClientRect()
      const px = ((clientX - r.left) * W) / r.width
      const py = ((clientY - r.top) * H) / r.height
      return { x: ex.invert(px), y: ey.invert(py) }
    },
    [ex, ey],
  )

  // Alça 1 (translação) fica em x̄; alça 2 (rotação) perto da borda direita.
  const xAlca1 = somas.xbar
  const xAlca2 = dominioX[0] + 0.85 * (dominioX[1] - dominioX[0])

  const aoMover = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!arrastando.current) return
      const d = paraDados(e.clientX, e.clientY)
      if (!d) return
      const yLim = Math.min(Math.max(d.y, dominioY[0]), dominioY[1])
      if (arrastando.current === 'intercepto') {
        // move a reta inteira: mantém a inclinação, muda β₀
        dispatch({ tipo: 'candidato', reta: { b0: yLim - b1 * xAlca1 } })
      } else {
        // gira em torno de (x̄, ŷ(x̄)): mantém o ponto de pivô fixo
        const yPivo = b0 + b1 * xAlca1
        const dx = xAlca2 - xAlca1
        if (Math.abs(dx) < 1e-9) return
        const novoB1 = (yLim - yPivo) / dx
        dispatch({
          tipo: 'candidato',
          reta: { b1: novoB1, b0: yPivo - novoB1 * xAlca1 },
        })
      }
    },
    [paraDados, dispatch, b0, b1, xAlca1, xAlca2, dominioY],
  )

  const iniciar =
    (qual: 'intercepto' | 'inclinacao') =>
    (e: React.PointerEvent<SVGGElement>) => {
      arrastando.current = qual
      svgRef.current?.setPointerCapture(e.pointerId)
      e.preventDefault()
    }

  const encerrar = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!arrastando.current) return
    arrastando.current = null
    if (svgRef.current?.hasPointerCapture(e.pointerId)) {
      svgRef.current.releasePointerCapture(e.pointerId)
    }
  }

  const reta = (i0: number, i1: number) => {
    const [xa, xb] = dominioX
    return {
      x1: ex(xa),
      y1: ey(i0 + i1 * xa),
      x2: ex(xb),
      y2: ey(i0 + i1 * xb),
    }
  }

  const pontos = useMemo(
    () =>
      amostra.x.map((xi, i) => (
        <circle
          key={i}
          cx={ex(xi)}
          cy={ey(amostra.y[i])}
          r={amostra.x.length > 200 ? 2 : 3}
          className="fill-slate-700/70"
        />
      )),
    [amostra, ex, ey],
  )

  const residuos = useMemo(() => {
    const e2 = amostra.x.map((xi, i) => {
      const r = amostra.y[i] - b0 - b1 * xi
      return r * r
    })
    const maxE2 = Math.max(...e2, 1e-12)
    return amostra.x.map((xi, i) => (
      <line
        key={i}
        x1={ex(xi)}
        y1={ey(amostra.y[i])}
        x2={ex(xi)}
        y2={ey(b0 + b1 * xi)}
        stroke="#f97316"
        strokeWidth={1.2}
        opacity={0.12 + 0.68 * Math.sqrt(e2[i] / maxE2)}
      />
    ))
  }, [amostra, b0, b1, ex, ey])

  const rCand = reta(b0, b1)
  const rVerd = reta(p.beta0, p.beta1)
  const rEmv = reta(emv.b0, emv.b1)
  const yAlca1 = b0 + b1 * xAlca1
  const yAlca2 = b0 + b1 * xAlca2

  return (
    <Panel
      titulo="A. Dispersão e reta candidata"
      descricao={
        <>
          Arraste a alça azul (move a reta, muda <em>β₀</em>) e a alça vazada
          (gira em torno de <em>x̄</em>, muda <em>β₁</em>). Os traços laranja são
          os resíduos: quanto mais escuros, mais pesam em{' '}
          <em>SQRes = Σ(yᵢ − β₀ − β₁xᵢ)²</em>.
        </>
      }
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="sem-selecao w-full touch-none"
        role="img"
        aria-label="Gráfico de dispersão com reta candidata arrastável"
        onPointerMove={aoMover}
        onPointerUp={encerrar}
        onPointerCancel={encerrar}
      >
        <clipPath id="areaA">
          <rect
            x={M.left}
            y={M.top}
            width={W - M.left - M.right}
            height={H - M.top - M.bottom}
          />
        </clipPath>

        <rect
          x={M.left}
          y={M.top}
          width={W - M.left - M.right}
          height={H - M.top - M.bottom}
          className="fill-slate-50 stroke-slate-200"
        />

        {/* eixos */}
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
              {num(t, 1)}
            </text>
          </g>
        ))}
        {ey.ticks(6).map((t) => (
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
        <text
          x={(M.left + W - M.right) / 2}
          y={H - 8}
          textAnchor="middle"
          className="fill-slate-600 text-[13px] italic"
        >
          x
        </text>
        <text
          x={14}
          y={(M.top + H - M.bottom) / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${(M.top + H - M.bottom) / 2})`}
          className="fill-slate-600 text-[13px] italic"
        >
          y
        </text>

        <g clipPath="url(#areaA)">
          {residuos}
          {pontos}

          {/* reta verdadeira */}
          <line
            {...rVerd}
            stroke="#64748b"
            strokeWidth={1.5}
            strokeDasharray="6 5"
          />

          {/* reta do EMV */}
          {!escondeEmv && (
            <line {...rEmv} stroke="#059669" strokeWidth={2.5} opacity={0.9} />
          )}

          {/* reta candidata */}
          <line {...rCand} stroke="#0284c7" strokeWidth={3} />
        </g>

        {/* alças */}
        <g
          className="cursor-ns-resize"
          onPointerDown={iniciar('intercepto')}
          role="slider"
          tabIndex={0}
          aria-label="Alça de intercepto (β₀)"
          aria-valuenow={Number(b0.toFixed(3))}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              const passo = (dominioY[1] - dominioY[0]) / 100
              dispatch({
                tipo: 'candidato',
                reta: { b0: b0 + (e.key === 'ArrowUp' ? passo : -passo) },
              })
            }
          }}
        >
          <circle
            cx={ex(xAlca1)}
            cy={ey(yAlca1)}
            r={14}
            fill="transparent"
            className="cursor-ns-resize"
          />
          <circle
            cx={ex(xAlca1)}
            cy={ey(yAlca1)}
            r={7}
            fill="#0284c7"
            stroke="#fff"
            strokeWidth={2}
          />
        </g>
        <g
          className="cursor-ns-resize"
          onPointerDown={iniciar('inclinacao')}
          role="slider"
          tabIndex={0}
          aria-label="Alça de inclinação (β₁)"
          aria-valuenow={Number(b1.toFixed(3))}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              const passo = 0.02 * (Math.abs(b1) + 1)
              const novo = b1 + (e.key === 'ArrowUp' ? passo : -passo)
              const yPivo = b0 + b1 * xAlca1
              dispatch({
                tipo: 'candidato',
                reta: { b1: novo, b0: yPivo - novo * xAlca1 },
              })
            }
          }}
        >
          <circle
            cx={ex(xAlca2)}
            cy={ey(yAlca2)}
            r={14}
            fill="transparent"
            className="cursor-ns-resize"
          />
          <circle
            cx={ex(xAlca2)}
            cy={ey(yAlca2)}
            r={7}
            fill="#fff"
            stroke="#0284c7"
            strokeWidth={3}
          />
        </g>
      </svg>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
        <li>
          <span className="mr-1 inline-block h-0.5 w-6 align-middle bg-sky-600" />
          reta candidata (β₀ᶜ, β₁ᶜ)
        </li>
        {!escondeEmv && (
          <li>
            <span className="mr-1 inline-block h-0.5 w-6 align-middle bg-emerald-600" />
            reta do EMV (β̂₀, β̂₁)
          </li>
        )}
        <li>
          <span className="mr-1 inline-block h-0.5 w-6 align-middle bg-slate-400" />
          reta verdadeira (β₀, β₁)
        </li>
        <li>
          <span className="mr-1 inline-block h-0.5 w-6 align-middle bg-orange-500" />
          resíduos
        </li>
      </ul>
    </Panel>
  )
}
