import { useCallback, useEffect, useMemo, useRef } from 'react'
import { scaleLinear } from 'd3-scale'
import { Panel } from '../../components/Panel'
import { rssFromSums } from '../../lib/regression'
import { marchingSquares } from '../../lib/contours'
import { viridis } from '../../lib/colormap'
import { num } from '../../lib/format'
import type { EmvAction, EmvDerivado, EmvState } from './useEmvState'

const CW = 560
const CH = 520
const MB = { top: 14, right: 16, bottom: 44, left: 64 }
const PW = CW - MB.left - MB.right
const PH = CH - MB.top - MB.bottom
/** Resolução da grade de avaliação de ℓ (PLANO: ~120×120). */
const G = 120
/** Escala de cor: deviances abaixo de −DEV_MAX saturam no roxo escuro. */
const DEV_MAX = 25
const NIVEIS = [0.5, 1, 2, 4, 8]
const ESCALA = 2 // supersampling do canvas

type Props = {
  estado: EmvState
  dispatch: (a: EmvAction) => void
  derivado: EmvDerivado
  escondeEmv: boolean
}

type Janela = { b0Min: number; b0Max: number; b1Min: number; b1Max: number }

/** Painel B — superfície da log-verossimilhança perfilada em (β₀, β₁). */
export function PainelB({ estado, dispatch, derivado, escondeEmv }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const arrastando = useRef(false)
  const { somas, emv, se, elipse } = derivado
  const p = estado.params
  const { b0, b1 } = estado.candidato

  /** Janela centrada no EMV e dimensionada pelos erros-padrão (β̂ ± 4·EP). */
  const janela = useMemo<Janela>(() => {
    const e0 = Number.isFinite(se.se0) && se.se0 > 0 ? se.se0 : 1
    const e1 = Number.isFinite(se.se1) && se.se1 > 0 ? se.se1 : 1
    let b0Min = emv.b0 - 4 * e0
    let b0Max = emv.b0 + 4 * e0
    let b1Min = emv.b1 - 4 * e1
    let b1Max = emv.b1 + 4 * e1
    // garante que o valor verdadeiro caiba na janela
    const folga0 = 0.05 * (b0Max - b0Min)
    const folga1 = 0.05 * (b1Max - b1Min)
    b0Min = Math.min(b0Min, p.beta0 - folga0)
    b0Max = Math.max(b0Max, p.beta0 + folga0)
    b1Min = Math.min(b1Min, p.beta1 - folga1)
    b1Max = Math.max(b1Max, p.beta1 + folga1)
    return { b0Min, b0Max, b1Min, b1Max }
  }, [emv, se, p.beta0, p.beta1])

  const ex = useMemo(
    () =>
      scaleLinear()
        .domain([janela.b0Min, janela.b0Max])
        .range([MB.left, MB.left + PW]),
    [janela],
  )
  const ey = useMemo(
    () =>
      scaleLinear()
        .domain([janela.b1Min, janela.b1Max])
        .range([MB.top + PH, MB.top]),
    [janela],
  )

  /**
   * Grade da deviance ℓ(β₀,β₁) − ℓ_máx (perfilada em σ²), que para o modelo
   * normal vale −(n/2)·log(SQRes / SQRes_mín). Recalculada só quando a amostra
   * ou a janela mudam — mover o candidato não redesenha o heatmap.
   */
  const grade = useMemo(() => {
    const v = new Float64Array(G * G)
    const rssMin = Math.max(rssFromSums(somas, emv.b0, emv.b1), 1e-300)
    const n = somas.n
    for (let j = 0; j < G; j++) {
      // linha 0 = topo = maior β₁
      const beta1 =
        janela.b1Max - ((janela.b1Max - janela.b1Min) * j) / (G - 1)
      for (let i = 0; i < G; i++) {
        const beta0 =
          janela.b0Min + ((janela.b0Max - janela.b0Min) * i) / (G - 1)
        const r = Math.max(rssFromSums(somas, beta0, beta1), 1e-300)
        v[j * G + i] = -(n / 2) * Math.log(r / rssMin)
      }
    }
    return v
  }, [somas, emv, janela])

  /** Heatmap + curvas de nível pré-renderizados fora da tela. */
  const fundo = useMemo(() => {
    if (typeof document === 'undefined') return null
    const pequeno = document.createElement('canvas')
    pequeno.width = G
    pequeno.height = G
    const ctxP = pequeno.getContext('2d')
    if (!ctxP) return null
    const img = ctxP.createImageData(G, G)
    for (let k = 0; k < G * G; k++) {
      const u = Math.min(1, -grade[k] / DEV_MAX) // 0 no máximo, 1 longe dele
      const [r, g, b] = viridis(1 - Math.sqrt(Math.max(0, u)))
      img.data[k * 4] = r
      img.data[k * 4 + 1] = g
      img.data[k * 4 + 2] = b
      img.data[k * 4 + 3] = 255
    }
    ctxP.putImageData(img, 0, 0)

    const grande = document.createElement('canvas')
    grande.width = PW * ESCALA
    grande.height = PH * ESCALA
    const ctx = grande.getContext('2d')
    if (!ctx) return null
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(pequeno, 0, 0, G, G, 0, 0, PW * ESCALA, PH * ESCALA)

    // curvas de nível em ℓ_máx − {0.5, 1, 2, 4, 8}
    const escalaC = (PW * ESCALA) / (G - 1)
    const escalaL = (PH * ESCALA) / (G - 1)
    ctx.lineWidth = 1.2 * ESCALA
    for (const nivel of NIVEIS) {
      const segs = marchingSquares(grade, G, G, -nivel)
      ctx.strokeStyle = `rgba(255,255,255,${nivel <= 1 ? 0.95 : 0.55})`
      ctx.beginPath()
      for (const [c1, l1, c2, l2] of segs) {
        ctx.moveTo(c1 * escalaC, l1 * escalaL)
        ctx.lineTo(c2 * escalaC, l2 * escalaL)
      }
      ctx.stroke()
    }
    return grande
  }, [grade])

  /** Desenha o quadro: fundo memoizado + elipse + marcadores + eixos. */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = CW * ESCALA
    canvas.height = CH * ESCALA
    ctx.setTransform(ESCALA, 0, 0, ESCALA, 0, 0)
    ctx.clearRect(0, 0, CW, CH)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CW, CH)

    if (fundo) ctx.drawImage(fundo, MB.left, MB.top, PW, PH)
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 1
    ctx.strokeRect(MB.left, MB.top, PW, PH)

    // eixos
    ctx.fillStyle = '#475569'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    for (const t of ex.ticks(6)) {
      ctx.fillText(num(t, 2), ex(t), MB.top + PH + 16)
    }
    ctx.textAlign = 'right'
    for (const t of ey.ticks(6)) {
      ctx.fillText(num(t, 2), MB.left - 8, ey(t) + 4)
    }
    ctx.textAlign = 'center'
    ctx.font = 'italic 13px system-ui, sans-serif'
    ctx.fillStyle = '#334155'
    ctx.fillText('β₀', MB.left + PW / 2, CH - 10)
    ctx.save()
    ctx.translate(16, MB.top + PH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('β₁', 0, 0)
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.rect(MB.left, MB.top, PW, PH)
    ctx.clip()

    // elipse de confiança 95% (revela o EMV: escondida no modo desafio)
    if (!escondeEmv && elipse.length > 1) {
      ctx.beginPath()
      elipse.forEach(([eb0, eb1], k) => {
        const px = ex(eb0)
        const py = ey(eb1)
        if (k === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.closePath()
      ctx.strokeStyle = '#f8fafc'
      ctx.lineWidth = 2.5
      ctx.setLineDash([6, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // marcador do valor verdadeiro
    const xv = ex(p.beta0)
    const yv = ey(p.beta1)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(xv - 7, yv)
    ctx.lineTo(xv + 7, yv)
    ctx.moveTo(xv, yv - 7)
    ctx.lineTo(xv, yv + 7)
    ctx.stroke()

    // marcador do EMV
    if (!escondeEmv) {
      ctx.beginPath()
      ctx.arc(ex(emv.b0), ey(emv.b1), 6, 0, 2 * Math.PI)
      ctx.fillStyle = '#10b981'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // marcador do candidato
    ctx.beginPath()
    ctx.arc(ex(b0), ey(b1), 7, 0, 2 * Math.PI)
    ctx.fillStyle = '#0284c7'
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.restore()
  }, [fundo, ex, ey, elipse, emv, b0, b1, p.beta0, p.beta1, escondeEmv])

  const mover = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const r = canvas.getBoundingClientRect()
      if (r.width === 0) return
      const px = ((e.clientX - r.left) * CW) / r.width
      const py = ((e.clientY - r.top) * CH) / r.height
      const novoB0 = ex.invert(Math.min(Math.max(px, MB.left), MB.left + PW))
      const novoB1 = ey.invert(Math.min(Math.max(py, MB.top), MB.top + PH))
      dispatch({ tipo: 'candidato', reta: { b0: novoB0, b1: novoB1 } })
    },
    [ex, ey, dispatch],
  )

  return (
    <Panel
      titulo="B. Superfície da log-verossimilhança"
      descricao={
        <>
          Cor e curvas mostram a <strong>deviance</strong> ℓ(β₀, β₁) − ℓ
          <sub>máx</sub> (com σ² já perfilado em σ̂² = SQRes/n). Clique ou
          arraste para mover a reta candidata — o painel A responde na hora. As
          curvas brancas estão em ℓ<sub>máx</sub> − {'{'}0,5; 1; 2; 4; 8{'}'}.
        </>
      }
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', aspectRatio: `${CW} / ${CH}` }}
        className="sem-selecao cursor-crosshair touch-none rounded-lg"
        aria-label="Superfície da log-verossimilhança no plano (beta0, beta1)"
        onPointerDown={(e) => {
          arrastando.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          mover(e)
        }}
        onPointerMove={(e) => {
          if (arrastando.current) mover(e)
        }}
        onPointerUp={(e) => {
          arrastando.current = false
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        }}
        onPointerCancel={() => {
          arrastando.current = false
        }}
      />
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
        <li>
          <span className="mr-1 inline-block size-2.5 rounded-full bg-sky-600 align-middle" />
          candidato (β₀ᶜ, β₁ᶜ)
        </li>
        {!escondeEmv && (
          <li>
            <span className="mr-1 inline-block size-2.5 rounded-full bg-emerald-500 align-middle" />
            EMV (β̂₀, β̂₁)
          </li>
        )}
        <li>
          <span className="mr-1 inline-block size-2.5 align-middle text-slate-400">
            ✛
          </span>
          valor verdadeiro
        </li>
        {!escondeEmv && <li>- - - elipse de confiança 95% via I(θ̂)⁻¹</li>}
      </ul>
      <p className="mt-2 text-xs text-slate-500">
        Amarelo = perto do máximo; roxo = deviance ≤ −{DEV_MAX}. A janela é
        β̂ ± 4·EP em cada eixo.
      </p>
    </Panel>
  )
}
