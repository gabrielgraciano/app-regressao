import { describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach } from 'vitest'
import { EmvModule } from './EmvModule'

afterEach(cleanup)

/** Cartão `Readout` que contém a legenda informada. */
function cartaoPelaLegenda(legenda: RegExp): HTMLElement {
  const p = screen.getByText(legenda)
  return p.closest('div') as HTMLElement
}

describe('EmvModule', () => {
  it('mostra os quatro painéis do módulo', () => {
    render(<EmvModule />)
    expect(screen.getByText(/Parâmetros da simulação/)).toBeDefined()
    expect(screen.getByText(/A\. Dispersão/)).toBeDefined()
    expect(screen.getByText(/B\. Superfície/)).toBeDefined()
    expect(screen.getByText(/C\. Perfil em σ²/)).toBeDefined()
    expect(screen.getByText(/Números/)).toBeDefined()
  })

  it('“Ir para o EMV” zera o gap de log-verossimilhança', () => {
    render(<EmvModule />)
    const antes = cartaoPelaLegenda(/gap: zero/i).textContent ?? ''
    expect(antes).not.toContain('0.000')

    fireEvent.click(screen.getByRole('button', { name: /Ir para o EMV/ }))
    expect(cartaoPelaLegenda(/gap: zero/i).textContent).toContain('0.000')
  })

  it('mexer no slider de n regenera a amostra e atualiza os números', () => {
    render(<EmvModule />)
    const cartaoN = cartaoPelaLegenda(/gap: zero/i)
    const gapInicial = cartaoN.textContent

    const slider = screen.getByLabelText(/tamanho da amostra/i)
    fireEvent.change(slider, { target: { value: '120' } })

    // o n mostrado nas somas suficientes acompanha o slider
    const somas = screen.getByText(/Somas suficientes/).parentElement as HTMLElement
    expect(within(somas).getByText('120')).toBeDefined()
    expect(cartaoPelaLegenda(/gap: zero/i).textContent).not.toBe(gapInicial)
  })

  it('modo desafio esconde o EMV, bloqueia o atalho e revela sob pedido', () => {
    render(<EmvModule />)
    fireEvent.click(screen.getByLabelText(/Modo desafio/))

    expect(screen.getByText(/placar: quanto menor, melhor/)).toBeDefined()
    expect(
      screen.getByRole('button', { name: /Ir para o EMV/ }),
    ).toHaveProperty('disabled', true)
    // valores do EMV aparecem como travessão enquanto escondidos
    expect(cartaoPelaLegenda(/máximo, atingido no EMV/).textContent).toContain(
      '—',
    )

    fireEvent.click(screen.getByRole('button', { name: /Revelar solução/ }))
    expect(
      cartaoPelaLegenda(/máximo, atingido no EMV/).textContent,
    ).not.toContain('—')
    expect(
      screen.getByRole('button', { name: /Ir para o EMV/ }),
    ).toHaveProperty('disabled', false)
  })

  it('o slider de σ² tira ℓ do máximo do perfil e o botão devolve', () => {
    render(<EmvModule />)
    expect(
      screen.getByText(/σ² está acompanhando automaticamente/),
    ).toBeDefined()

    const sliderSigma = screen.getByLabelText(/variância usada em ℓ/)
    fireEvent.change(sliderSigma, { target: { value: '9' } })
    expect(screen.getByText(/σ² fixado à mão/)).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: /Voltar a σ̂²/ }))
    expect(
      screen.getByText(/σ² está acompanhando automaticamente/),
    ).toBeDefined()
  })
})
