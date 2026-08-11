import { Panel } from '../../components/Panel'
import { Readout } from '../../components/Readout'
import { Controles } from './Controles'
import { useEmvState } from './useEmvState'

/** Módulo M1 — EMV na regressão linear simples. */
export function EmvModule() {
  const { estado, dispatch, derivado } = useEmvState()
  const escondeEmv = estado.modoDesafio && !estado.revelado

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
      <div className="flex flex-col gap-4">
        <Controles estado={estado} dispatch={dispatch} derivado={derivado} />
      </div>

      <div className="flex flex-col gap-4">
        <Panel
          titulo="Números"
          descricao="Cada valor traz o símbolo da fórmula correspondente."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Readout
              simbolo="\ell(\beta_0^c, \beta_1^c, \sigma^2)"
              valor={derivado.logLikCand}
              destaque="candidato"
              legenda="log-verossimilhança da reta candidata"
            />
            <Readout
              simbolo="\ell(\hat\theta)"
              valor={escondeEmv ? '—' : derivado.logLikEmv}
              destaque="emv"
              legenda="máximo da log-verossimilhança"
            />
            <Readout
              simbolo="\ell(\hat\theta) - \ell(\text{cand.})"
              valor={derivado.gap}
              destaque="alerta"
              legenda="quanto falta para chegar ao máximo"
            />
            <Readout
              simbolo="SQRes"
              valor={derivado.sqResCand}
              legenda="soma de quadrados dos resíduos do candidato"
            />
            <Readout
              simbolo="\hat\beta_0"
              valor={escondeEmv ? '—' : derivado.emv.b0}
            />
            <Readout
              simbolo="\hat\beta_1"
              valor={escondeEmv ? '—' : derivado.emv.b1}
            />
            <Readout
              simbolo="\hat\sigma^2_{\text{EMV}} = SQRes/n"
              valor={escondeEmv ? '—' : derivado.sigma2Emv}
            />
            <Readout
              simbolo="s^2 = SQRes/(n-2)"
              valor={escondeEmv ? '—' : derivado.s2}
            />
            <Readout
              simbolo="EP(\hat\beta_1)"
              valor={escondeEmv ? '—' : derivado.se.se1}
            />
          </div>
        </Panel>
      </div>
    </div>
  )
}
