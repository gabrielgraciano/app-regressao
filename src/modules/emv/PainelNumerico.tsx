import { Panel } from '../../components/Panel'
import { Formula } from '../../components/Formula'
import { Readout } from '../../components/Readout'
import { numTex } from '../../lib/format'
import type { EmvDerivado, EmvState } from './useEmvState'

type Props = {
  estado: EmvState
  derivado: EmvDerivado
  escondeEmv: boolean
}

function matrizTex(m: number[][], casas = 3): string {
  return `\\begin{bmatrix} ${m
    .map((linha) => linha.map((v) => numTex(v, casas)).join(' & '))
    .join(' \\\\ ')} \\end{bmatrix}`
}

const OCULTO = '\\begin{bmatrix} \\cdot & \\cdot & \\cdot \\\\ \\cdot & \\cdot & \\cdot \\\\ \\cdot & \\cdot & \\cdot \\end{bmatrix}'

/** Painel numérico: os símbolos do PLANO §2 com os valores ao vivo. */
export function PainelNumerico({ estado, derivado, escondeEmv }: Props) {
  const d = derivado
  const oculto = (v: number) => (escondeEmv ? '—' : v)

  return (
    <Panel
      titulo="Números — o quadro virando valor"
      descricao="Cada número aparece com o símbolo exato da fórmula do modelo."
    >
      <Formula
        bloco
        className="overflow-x-auto text-slate-800"
        tex={String.raw`\ell(\beta_0,\beta_1,\sigma^2) = -\tfrac{n}{2}\log(2\pi) - \tfrac{n}{2}\log(\sigma^2) - \tfrac{1}{2\sigma^2}\sum_{i=1}^{n}(y_i - \beta_0 - \beta_1 x_i)^2`}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Readout
          simbolo={String.raw`\ell(\beta_0^{c},\beta_1^{c},\sigma^2)`}
          valor={d.logLikCand}
          destaque="candidato"
          legenda="log-verossimilhança da reta candidata"
        />
        <Readout
          simbolo={String.raw`\ell(\hat\theta)`}
          valor={oculto(d.logLikEmv)}
          destaque="emv"
          legenda="máximo, atingido no EMV"
        />
        <Readout
          simbolo={String.raw`\ell(\hat\theta)-\ell(\text{cand.})`}
          valor={d.gap}
          destaque="alerta"
          legenda="gap: zero só quando o candidato é o EMV"
        />
        <Readout
          simbolo={String.raw`SQRes^{c} = \sum (y_i-\beta_0^c-\beta_1^c x_i)^2`}
          valor={d.sqResCand}
          legenda="soma de quadrados dos resíduos do candidato"
        />
        <Readout
          simbolo={String.raw`\hat\beta_1 = S_{xy}/S_{xx}`}
          valor={oculto(d.emv.b1)}
        />
        <Readout
          simbolo={String.raw`\hat\beta_0 = \bar y - \hat\beta_1\bar x`}
          valor={oculto(d.emv.b0)}
        />
      </div>

      <h3 className="mt-6 text-sm font-semibold text-slate-800">
        Os dois estimadores de σ² — o ponto onde é fácil escorregar
      </h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <Readout
          simbolo={String.raw`\hat\sigma^2_{\text{EMV}} = SQRes/n`}
          valor={oculto(d.sigma2Emv)}
          legenda="estimador de máxima verossimilhança"
          destaque="emv"
        />
        <Readout
          simbolo={String.raw`s^2 = SQRes/(n-2)`}
          valor={oculto(d.s2)}
          legenda="estimador não viesado (usa n − 2 graus de liberdade)"
        />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Os dois usam o <em>mesmo</em> SQRes e diferem só no denominador:{' '}
        <Formula
          tex={String.raw`\hat\sigma^2_{\text{EMV}} = \frac{n-2}{n}\,s^2`}
        />
        . Como <Formula tex={String.raw`(n-2)/n < 1`} />, o EMV é{' '}
        <strong>viesado para baixo</strong> — subestima σ² em média, e o viés só
        some quando n cresce. Aumente <em>n</em> nos controles e veja os dois
        valores se aproximarem.
      </p>

      <h3 className="mt-6 text-sm font-semibold text-slate-800">
        Informação de Fisher e erros-padrão
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Esperança do negativo da hessiana de ℓ, avaliada em{' '}
        <Formula tex={String.raw`\hat\theta = (\hat\beta_0,\hat\beta_1,\hat\sigma^2)`} />
        . Os blocos que cruzam β com σ² são nulos: os estimadores de β e de σ²
        são assintoticamente independentes.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 overflow-x-auto">
        <Formula
          tex={String.raw`I(\theta) = \begin{bmatrix} \dfrac{n}{\sigma^2} & \dfrac{\sum x_i}{\sigma^2} & 0 \\[6pt] \dfrac{\sum x_i}{\sigma^2} & \dfrac{\sum x_i^2}{\sigma^2} & 0 \\[6pt] 0 & 0 & \dfrac{n}{2\sigma^4} \end{bmatrix}`}
          bloco
        />
        <Formula
          tex={String.raw`I(\hat\theta) = ${escondeEmv ? OCULTO : matrizTex(d.info, 2)}`}
          bloco
        />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-3 overflow-x-auto">
        <Formula
          tex={String.raw`\widehat{\operatorname{Var}}(\hat\theta) \approx I(\hat\theta)^{-1} = ${
            escondeEmv ? OCULTO : matrizTex(d.infoInv, 4)
          }`}
          bloco
        />
      </div>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <Readout
          simbolo={String.raw`EP(\hat\beta_0)`}
          valor={oculto(d.se.se0)}
          legenda="√[I⁻¹]₁₁"
        />
        <Readout
          simbolo={String.raw`EP(\hat\beta_1)`}
          valor={oculto(d.se.se1)}
          legenda="√[I⁻¹]₂₂"
        />
        <Readout
          simbolo={String.raw`EP(\hat\sigma^2)`}
          valor={oculto(d.se.seSigma2)}
          legenda="√[I⁻¹]₃₃"
        />
      </div>

      <h3 className="mt-6 text-sm font-semibold text-slate-800">
        Somas suficientes da amostra
      </h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Readout simbolo="n" valor={d.somas.n} casas={0} />
        <Readout simbolo={String.raw`\bar x`} valor={d.somas.xbar} />
        <Readout simbolo={String.raw`S_{xx}`} valor={d.somas.Sxx} />
        <Readout simbolo={String.raw`S_{xy}`} valor={d.somas.Sxy} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Reta candidata atual: β₀ᶜ = {estado.candidato.b0.toFixed(3)}, β₁ᶜ ={' '}
        {estado.candidato.b1.toFixed(3)}; σ² em uso ={' '}
        {d.sigma2Ativo.toFixed(3)}.
      </p>
    </Panel>
  )
}
