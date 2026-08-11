import { useMemo } from 'react'
import katex from 'katex'

type Props = {
  /** Código LaTeX da fórmula. */
  tex: string
  /** Fórmula em bloco (centralizada) em vez de em linha. */
  bloco?: boolean
  className?: string
}

/** Renderiza uma fórmula com KaTeX. */
export function Formula({ tex, bloco = false, className = '' }: Props) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: bloco,
        throwOnError: false,
        output: 'html',
      }),
    [tex, bloco],
  )
  const Tag = bloco ? 'div' : 'span'
  return (
    <Tag
      className={className}
      // KaTeX gera HTML confiável a partir de fórmulas escritas no próprio código.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
