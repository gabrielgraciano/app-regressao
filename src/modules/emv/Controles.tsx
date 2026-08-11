import { Panel } from '../../components/Panel'
import { Slider } from '../../components/Slider'
import type { EmvAction, EmvDerivado, EmvState } from './useEmvState'

type Props = {
  estado: EmvState
  dispatch: (a: EmvAction) => void
  derivado: EmvDerivado
}

const botao =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'

/** Painel lateral: parâmetros da simulação e ações. */
export function Controles({ estado, dispatch, derivado }: Props) {
  const p = estado.params
  const setParam = (chave: keyof typeof p) => (valor: number) =>
    dispatch({ tipo: 'param', chave, valor })

  return (
    <Panel
      titulo="Parâmetros da simulação"
      descricao={
        <>
          Os dados são gerados por <em>Yᵢ = β₀ + β₁xᵢ + εᵢ</em>, com{' '}
          <em>εᵢ ~ N(0, σ²)</em>. A semente fixa a amostra: com a mesma semente,
          todo mundo na sala vê exatamente os mesmos pontos.
        </>
      }
    >
      <Slider
        rotulo="tamanho da amostra"
        simbolo="n"
        valor={p.n}
        min={5}
        max={500}
        passo={1}
        casas={0}
        onChange={setParam('n')}
      />
      <Slider
        rotulo="intercepto verdadeiro"
        simbolo="\beta_0"
        valor={p.beta0}
        min={-10}
        max={10}
        passo={0.1}
        onChange={setParam('beta0')}
      />
      <Slider
        rotulo="inclinação verdadeira"
        simbolo="\beta_1"
        valor={p.beta1}
        min={-5}
        max={5}
        passo={0.05}
        onChange={setParam('beta1')}
      />
      <Slider
        rotulo="desvio-padrão do erro"
        simbolo="\sigma"
        valor={p.sigma}
        min={0.1}
        max={10}
        passo={0.1}
        legenda="σ maior espalha os pontos e achata a superfície de ℓ."
        onChange={setParam('sigma')}
      />
      <div className="grid grid-cols-2 gap-3">
        <Slider
          rotulo="x mínimo"
          simbolo="x_{\min}"
          valor={p.xMin}
          min={-20}
          max={20}
          passo={0.5}
          casas={1}
          onChange={setParam('xMin')}
        />
        <Slider
          rotulo="x máximo"
          simbolo="x_{\max}"
          valor={p.xMax}
          min={-20}
          max={20}
          passo={0.5}
          casas={1}
          onChange={setParam('xMax')}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label
          htmlFor="semente"
          className="text-sm font-medium whitespace-nowrap text-slate-700"
        >
          Semente
        </label>
        <input
          id="semente"
          type="number"
          value={p.seed}
          min={0}
          step={1}
          onChange={(e) =>
            dispatch({
              tipo: 'param',
              chave: 'seed',
              valor: Math.max(0, Math.floor(Number(e.currentTarget.value) || 0)),
            })
          }
          className="w-28 rounded-lg border border-slate-300 px-2 py-1 font-mono text-sm"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={botao}
          onClick={() => dispatch({ tipo: 'novaAmostra' })}
        >
          Nova amostra
        </button>
        <button
          type="button"
          className={botao}
          disabled={estado.modoDesafio && !estado.revelado}
          title={
            estado.modoDesafio && !estado.revelado
              ? 'No modo desafio, o atalho fica bloqueado até revelar a solução.'
              : undefined
          }
          onClick={() =>
            dispatch({
              tipo: 'candidato',
              reta: { b0: derivado.emv.b0, b1: derivado.emv.b1 },
            })
          }
        >
          Ir para o EMV
        </button>
        <button
          type="button"
          className={botao}
          onClick={() =>
            dispatch({ tipo: 'candidato', reta: { b0: p.beta0, b1: p.beta1 } })
          }
        >
          Ir para a reta verdadeira
        </button>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={estado.modoDesafio}
          onChange={(e) =>
            dispatch({ tipo: 'modoDesafio', ligado: e.currentTarget.checked })
          }
          className="size-4 accent-sky-600"
        />
        Modo desafio (esconde o EMV)
      </label>
    </Panel>
  )
}
