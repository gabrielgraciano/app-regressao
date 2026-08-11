import type { ReactNode } from 'react'

type Props = {
  titulo: string
  /** Frase curta dizendo o que olhar no painel. */
  descricao?: ReactNode
  acoes?: ReactNode
  children: ReactNode
  className?: string
}

/** Cartão com título, texto didático opcional e conteúdo. */
export function Panel({
  titulo,
  descricao,
  acoes,
  children,
  className = '',
}: Props) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>
        {acoes ? <div className="flex items-center gap-2">{acoes}</div> : null}
      </header>
      {descricao ? (
        <p className="px-4 pt-3 text-sm leading-relaxed text-slate-600">
          {descricao}
        </p>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  )
}
