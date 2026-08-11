import { Panel } from '../../components/Panel'
import { Readout } from '../../components/Readout'
import { Controles } from './Controles'
import { PainelA } from './PainelA'
import { PainelB } from './PainelB'
import { PainelC } from './PainelC'
import { PainelNumerico } from './PainelNumerico'
import { useEmvState } from './useEmvState'

function mensagemDoGap(gap: number): string {
  if (!Number.isFinite(gap)) return 'Ajuste a reta para começar.'
  if (gap < 0.01) return 'É isso: você está no EMV (ou muito perto dele).'
  if (gap < 0.5) return 'Quase lá — falta menos de meia unidade de ℓ.'
  if (gap < 2) return 'Perto. Tente girar a reta em torno de x̄.'
  return 'Ainda longe: procure a direção em que ℓ cresce no painel B.'
}

/** Módulo M1 — EMV na regressão linear simples. */
export function EmvModule() {
  const { estado, dispatch, derivado } = useEmvState()
  const escondeEmv = estado.modoDesafio && !estado.revelado

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(300px,360px)_1fr] lg:items-start">
      <div className="flex flex-col gap-4 lg:sticky lg:top-4">
        <Controles estado={estado} dispatch={dispatch} derivado={derivado} />

        {estado.modoDesafio && (
          <Panel
            titulo="Modo desafio"
            descricao="A reta do EMV está escondida. Arraste a candidata até zerar o gap de log-verossimilhança."
          >
            <Readout
              simbolo={String.raw`\ell(\hat\theta)-\ell(\text{cand.})`}
              valor={derivado.gap}
              destaque="alerta"
              legenda="placar: quanto menor, melhor"
            />
            <p className="mt-2 text-sm text-slate-600">
              {mensagemDoGap(derivado.gap)}
            </p>
            <button
              type="button"
              className="mt-3 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              disabled={estado.revelado}
              onClick={() => dispatch({ tipo: 'revelar' })}
            >
              {estado.revelado ? 'Solução revelada' : 'Revelar solução'}
            </button>
          </Panel>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <PainelA
          estado={estado}
          dispatch={dispatch}
          derivado={derivado}
          escondeEmv={escondeEmv}
        />
        <PainelB
          estado={estado}
          dispatch={dispatch}
          derivado={derivado}
          escondeEmv={escondeEmv}
        />
        <PainelC estado={estado} dispatch={dispatch} derivado={derivado} />
        <PainelNumerico
          estado={estado}
          derivado={derivado}
          escondeEmv={escondeEmv}
        />
      </div>
    </div>
  )
}
