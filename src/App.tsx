import { EmvModule } from './modules/emv/EmvModule'

const modulos = [
  { id: 'emv', rotulo: 'M1 — EMV na regressão simples', ativo: true },
  { id: 'diagnostico', rotulo: 'M3 — Diagnóstico', ativo: false },
  { id: 'multipla', rotulo: 'M2 — Regressão múltipla', ativo: false },
]

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Regressão: simulação e aprendizado
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Mexa nos parâmetros e veja a fórmula do quadro virar número na tela.
          </p>
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Módulos">
            {modulos.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!m.ativo}
                aria-current={m.ativo ? 'page' : undefined}
                className={
                  m.ativo
                    ? 'rounded-full bg-sky-600 px-3 py-1 text-sm font-medium text-white'
                    : 'cursor-not-allowed rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-400'
                }
              >
                {m.rotulo}
                {m.ativo ? '' : ' (em breve)'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <EmvModule />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-4 text-sm text-slate-500">
          Material de estudo de MAE0350 — Análise de Regressão (IME-USP).
          Código aberto em{' '}
          <a
            className="text-sky-700 underline"
            href="https://github.com/gabrielgraciano/app-regressao"
          >
            github.com/gabrielgraciano/app-regressao
          </a>
          .
        </div>
      </footer>
    </div>
  )
}
